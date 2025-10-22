"use client"

import { useState, useEffect } from "react"
import { useNDK } from "@/components/nostr-provider"
import type { NDKEvent } from "@nostr-dev-kit/ndk"
import type { Badge } from "./use-badges"
import { normalizeBadgeId, buildBadgeId } from "@/lib/nostr/badge-id"

export interface BadgeWithAward extends Badge {
  awardId: string
  awardedBy: string
  awardedAt: number
}

export function useBadgeAwards(recipientPubkey: string | null | undefined) {
  const [awardedBadges, setAwardedBadges] = useState<BadgeWithAward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { ndk } = useNDK()

  useEffect(() => {
    if (!recipientPubkey) {
      setAwardedBadges([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function fetchAwards() {
  try {
    setIsLoading(true)
    setError(null)

    // Paso 1: Fetch award events con timeout
    console.log("⏱️ START: Fetching award events for:", recipientPubkey)

// Crear múltiples subscripciones con timeout corto
const fetchWithTimeout = async () => {
  const subscription = ndk.subscribe(
    {
      kinds: [8],
      "#p": [recipientPubkey!],
      limit: 100,
    },
    { closeOnEose: true }
  )

  const events = new Set<NDKEvent>()
  
  return new Promise<Set<NDKEvent>>((resolve, reject) => {
    const timeout = setTimeout(() => {
      subscription.stop()
      console.log("⏱️ Subscription timeout, returning", events.size, "events")
      resolve(events)
    }, 5000) // 5 segundos

    subscription.on('event', (event: NDKEvent) => {
      events.add(event)
    })

    subscription.on('eose', () => {
      clearTimeout(timeout)
      subscription.stop()
      console.log("⏱️ EOSE received with", events.size, "events")
      resolve(events)
    })

    subscription.on('close', () => {
      clearTimeout(timeout)
      resolve(events)
    })
  })
}

const awardEvents = await fetchWithTimeout()
console.log("⏱️ DONE: Found award events:", awardEvents.size)

    if (!mounted) return

    if (awardEvents.size === 0) {
      setAwardedBadges([])
      setIsLoading(false)
      return
    }

        // Paso 2: Parsear awards y construir filtro para badge definitions
        const awardMap = new Map<string, { awardId: string; awardedBy: string; awardedAt: number }>()
        const badgeFilters = new Map<string, { kind: number; pubkey: string; identifier: string }>()

        Array.from(awardEvents).forEach((event) => {
          const aTag = event.tags.find((tag) => tag[0] === "a")
          if (!aTag?.[1]) return

          const badgeId = normalizeBadgeId(aTag[1])
          const awardedAt = event.created_at || 0

          // Mantener solo el award más reciente por badge
          if (!awardMap.has(badgeId) || awardMap.get(badgeId)!.awardedAt < awardedAt) {
            awardMap.set(badgeId, {
              awardId: event.id,
              awardedBy: event.pubkey,
              awardedAt,
            })
          }

          // Preparar filtro para badge definition
          const parts = badgeId.split(":")
          if (parts.length >= 3) {
            const [kindStr, pubkey, ...identifierParts] = parts
            const kind = Number.parseInt(kindStr, 10)
            const identifier = identifierParts.join(":")
            if (!isNaN(kind) && pubkey && identifier) {
              badgeFilters.set(badgeId, { kind, pubkey, identifier })
            }
          }
        })

        if (awardMap.size === 0) {
          setAwardedBadges([])
          setIsLoading(false)
          return
        }

        // Paso 3: Fetch badge definitions en paralelo con awards para mejor rendimiento
        const authors = Array.from(new Set(Array.from(badgeFilters.values()).map((v) => v.pubkey)))
        const identifiers = Array.from(new Set(Array.from(badgeFilters.values()).map((v) => v.identifier)))
        const kinds = Array.from(new Set(Array.from(badgeFilters.values()).map((v) => v.kind)))

        // Optimizar límite basado en awards encontrados
        const optimizedLimit = Math.min(Math.max(awardMap.size * 2, 50), 200)

        // Fetch badge definitions con timeout más corto
        console.log("Fetching badge definitions for", authors.length, "authors")
    const badgeEvents = await ndk.fetchEvents({
      kinds,
      authors,
      "#d": identifiers,
      limit: 500,
    })
        console.log("Found badge definition events:", badgeEvents.size)

        if (!mounted) return

        // Paso 4: Construir badges con award info
        const badgesWithAwards: BadgeWithAward[] = []

        Array.from(badgeEvents).forEach((event: NDKEvent) => {
          const getTag = (tagName: string): string | undefined => {
            const tag = event.tags.find((t: any) => t[0] === tagName)
            return tag ? tag[1] : undefined
          }

          const identifier = getTag("d") || ""
          const badgeId = buildBadgeId(event.kind, event.pubkey, identifier)
          const awardInfo = awardMap.get(badgeId)

          if (awardInfo) {
            badgesWithAwards.push({
              id: badgeId,
              identifier,
              name: getTag("name") || "Unnamed Badge",
              description: getTag("description") || "",
              image: getTag("image") || "",
              thumb: getTag("thumb"),
              creator: event.pubkey,
              createdAt: event.created_at || 0,
              event,
              awardId: awardInfo.awardId,
              awardedBy: awardInfo.awardedBy,
              awardedAt: awardInfo.awardedAt,
            })
          }
        })

        // Ordenar por fecha de award (más reciente primero)
        badgesWithAwards.sort((a, b) => b.awardedAt - a.awardedAt)

        setAwardedBadges(badgesWithAwards)
      } catch (err) {
        if (!mounted) return
        console.error("Failed to fetch badge awards:", err)
        setError(err instanceof Error && err.message.includes('timeout') ? "Loading timeout - please try again" : "Failed to load badge awards")
        // Set empty array on error to stop loading state
        setAwardedBadges([])
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

  const refetch = () => {
    setIsLoading(true)
  }

  return { awardedBadges, isLoading, error, refetch }
}