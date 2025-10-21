"use client"

import { useState, useEffect } from "react"
import { useNDK } from "@/components/nostr-provider"
import type { NDKEvent } from "@nostr-dev-kit/ndk"
import type { Badge } from "./use-badges"
import { normalizeBadgeId, buildBadgeId } from "@/lib/nostr/badge-id"

const badgeCache = new Map<string, Badge>()

// CAMBIAR: Agregar awardId
interface BadgeAward {
  badgeId: string
  awardedBy: string
  awardedAt: number
  awardId: string  // ← AGREGAR
}

// AGREGAR: Interface para badges con award info
export interface BadgeWithAward extends Badge {
  awardId: string
}

export function useBadgeAwards(recipientPubkey: string | null | undefined) {
  const [awards, setAwards] = useState<BadgeAward[]>([])
  const [awardedBadges, setAwardedBadges] = useState<BadgeWithAward[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { ndk } = useNDK()

  const refetch = async () => {
    if (!recipientPubkey || !ndk) return
    await fetchDefinitionsWithRetries(recipientPubkey, ndk)
  }

  async function fetchDefinitionsWithRetries(pubkey: string, ndkInstance: any) {
  setIsUpdating(true)
  try {
    const maxAttempts = 1  // CAMBIAR de 3 a 1
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
          const missing: Map<string, { kind: number; pubkey: string; identifier: string }> = new Map()
          awards.forEach((a) => {
            if (!badgeCache.has(a.badgeId)) {
              const parts = a.badgeId.split(":")
              if (parts.length >= 3) {
                const [kindStr, pkey, ...identifierParts] = parts
                const kind = Number.parseInt(kindStr, 10)
                const identifier = identifierParts.join(":")
                if (!isNaN(kind) && pkey && identifier) missing.set(a.badgeId, { kind, pubkey: pkey, identifier })
              }
            }
          })

          if (missing.size === 0) return

          const authors = Array.from(new Set(Array.from(missing.values()).map((v) => v.pubkey)))
          const identifiers = Array.from(new Set(Array.from(missing.values()).map((v) => v.identifier)))
          const kinds = Array.from(new Set(Array.from(missing.values()).map((v) => v.kind)))

          const fetchPromise = ndkInstance.fetchEvents({ kinds, authors, "#d": identifiers, limit: 500 })
        const timeoutMs = 2000  // CAMBIAR de 3000 * attempt a 2000 fijo
        const timeoutPromise = new Promise((_, rej) => setTimeout(() => rej(new Error("fetch timeout")), timeoutMs))
          const events = await Promise.race([fetchPromise, timeoutPromise])
          const fetchedEvents = Array.from(events as Iterable<NDKEvent>)

          if (fetchedEvents.length > 0) {
            const fetchedBadgeMap = new Map<string, Badge>()
            fetchedEvents.forEach((event: NDKEvent) => {
              if (!event) return
              const getTag = (tagName: string): string | undefined => {
                const tag = event.tags.find((t: any) => t[0] === tagName)
                return tag ? tag[1] : undefined
              }
              const identifier = getTag("d") || ""
              const badgeId = buildBadgeId(event.kind, event.pubkey, identifier)
              const badge: Badge = {
                id: badgeId,
                identifier,
                name: getTag("name") || "Unnamed Badge",
                description: getTag("description") || "",
                image: getTag("image") || "",
                thumb: getTag("thumb"),
                creator: event.pubkey,
                createdAt: event.created_at || 0,
                event,
              }
              badgeCache.set(badgeId, badge)
              fetchedBadgeMap.set(badgeId, badge)
            })

            // CAMBIAR: Construir badges con awardId
            const updatedBadges: BadgeWithAward[] = awards
              .map((a) => {
                const badge = badgeCache.get(a.badgeId) || fetchedBadgeMap.get(a.badgeId)
                if (!badge) return null
                return { ...badge, awardId: a.awardId }
              })
              .filter(Boolean) as BadgeWithAward[]
              
            const final = Array.from(new Map(updatedBadges.map((b) => [b.id, b])).values())
            setAwardedBadges(final)
            return
          }
        } catch (err) {
          const waitMs = 300 * attempt
          await new Promise((r) => setTimeout(r, waitMs))
        }
      }
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    if (!recipientPubkey) {
      setAwards([])
      setAwardedBadges([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function fetchAwards() {
  if (!recipientPubkey) return
  
  try {
    setIsLoading(true)
    console.log("Starting fetchAwards...")  // AGREGAR

    const awardEvents = await ndk.fetchEvents({
      kinds: [8],
      "#p": [recipientPubkey],
      limit: 100,
    })
    
    console.log("Found award events:", awardEvents.size)  // AGREGAR

        if (!mounted) return

        const parsedAwards: BadgeAward[] = []
        const missingBadgeMap = new Map<string, { kind: number; pubkey: string; identifier: string }>()

        Array.from(awardEvents).forEach((event) => {
          const aTag = event.tags.find((tag) => tag[0] === "a")
          if (aTag && aTag[1]) {
            const rawBadgeId = aTag[1]
            const badgeId = normalizeBadgeId(rawBadgeId)
            parsedAwards.push({
              badgeId,
              awardedBy: event.pubkey,
              awardedAt: event.created_at || 0,
              awardId: event.id,  // ← AGREGAR el ID del evento
            })

            if (!badgeCache.has(badgeId)) {
              const parts = badgeId.split(":")
              if (parts.length >= 3) {
                const [kindStr, pubkey, ...identifierParts] = parts
                const kind = Number.parseInt(kindStr, 10)
                const identifier = identifierParts.join(":")

                if (!isNaN(kind) && pubkey && identifier) {
                  missingBadgeMap.set(badgeId, { kind, pubkey, identifier })
                }
              }
            }
          }
        })

        const dedupedParsedAwardsMap = new Map<string, BadgeAward>()
        parsedAwards.forEach((a) => {
          if (!dedupedParsedAwardsMap.has(a.badgeId) || (dedupedParsedAwardsMap.get(a.badgeId)!.awardedAt < a.awardedAt)) {
            dedupedParsedAwardsMap.set(a.badgeId, a)
          }
        })
        const dedupedParsedAwards = Array.from(dedupedParsedAwardsMap.values())
        setAwards(dedupedParsedAwards)

        // CAMBIAR: Construir badges con awardId
        const initialBadges: BadgeWithAward[] = dedupedParsedAwards.map((a) => {
          const cached = badgeCache.get(a.badgeId)
          if (cached) return { ...cached, awardId: a.awardId }
          return {
            id: a.badgeId,
            identifier: a.badgeId.split(":").slice(2).join(":"),
            name: "Loading...",
            description: "",
            image: "",
            thumb: undefined,
            creator: "",
            createdAt: 0,
            event: undefined as any,
            awardId: a.awardId,
          }
        })

        setAwardedBadges(initialBadges)
        setIsLoading(false)

        if (missingBadgeMap.size === 0) {
          return
        }

        const authors = Array.from(new Set(Array.from(missingBadgeMap.values()).map((v) => v.pubkey)))
        const identifiers = Array.from(new Set(Array.from(missingBadgeMap.values()).map((v) => v.identifier)))
        const kinds = Array.from(new Set(Array.from(missingBadgeMap.values()).map((v) => v.kind)))

        const fetchPromise = ndk.fetchEvents({ kinds, authors, "#d": identifiers, limit: 500 })
const timeoutMs = 3000  // CAMBIAR de 5000 a 3000
        const timeoutPromise = new Promise((_, rej) => 
          setTimeout(() => rej(new Error("fetch timeout")), timeoutMs)
        )
        
        let fetchedEvents: NDKEvent[] = []
        try {
          const events = await Promise.race([fetchPromise, timeoutPromise])
          fetchedEvents = Array.from(events as Iterable<NDKEvent>)
        } catch (fetchErr) {
          console.warn("Fetch timeout/error, retrying with fetchDefinitionsWithRetries:", fetchErr)
          await fetchDefinitionsWithRetries(recipientPubkey, ndk)
          return
        }

        if (!mounted) return

        fetchedEvents.forEach((event: NDKEvent) => {
          if (!event) return
          const getTag = (tagName: string): string | undefined => {
            const tag = event.tags.find((t: any) => t[0] === tagName)
            return tag ? tag[1] : undefined
          }
          const identifier = getTag("d") || ""
          const badgeId = buildBadgeId(event.kind, event.pubkey, identifier)
          const badge: Badge = {
            id: badgeId,
            identifier,
            name: getTag("name") || "Unnamed Badge",
            description: getTag("description") || "",
            image: getTag("image") || "",
            thumb: getTag("thumb"),
            creator: event.pubkey,
            createdAt: event.created_at || 0,
            event,
          }
          badgeCache.set(badgeId, badge)
        })

        if (!mounted) return

        // CAMBIAR: Reconstruir con awardId
        const updatedBadges: BadgeWithAward[] = dedupedParsedAwards
          .map((a) => {
            const badge = badgeCache.get(a.badgeId)
            if (!badge) return null
            return { ...badge, awardId: a.awardId }
          })
          .filter(Boolean) as BadgeWithAward[]

        const finalBadgesMap = new Map<string, BadgeWithAward>()
        updatedBadges.forEach((b) => {
          if (!finalBadgesMap.has(b.id)) finalBadgesMap.set(b.id, b)
        })
        setAwardedBadges(Array.from(finalBadgesMap.values()))

      } catch (err) {
        if (!mounted) return
        console.error("Failed to fetch badge awards:", err)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchAwards()

    return () => {
      mounted = false
    }
  }, [recipientPubkey, ndk])

  return { awards, awardedBadges, isLoading, isUpdating, refetch }
}