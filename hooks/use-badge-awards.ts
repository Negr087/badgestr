"use client"

import { useState, useEffect } from "react"
import { useNDK } from "@/components/nostr-provider"
import type { Badge } from "./use-badges"

interface BadgeAward {
  badgeId: string
  awardedBy: string
  awardedAt: number
}

export function useBadgeAwards(recipientPubkey: string | null | undefined) {
  const [awards, setAwards] = useState<BadgeAward[]>([])
  const [awardedBadges, setAwardedBadges] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { ndk } = useNDK()

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

        // Buscar eventos kind 8 (badge awards) donde el usuario es el receptor
        const awardEvents = await ndk.fetchEvents({
          kinds: [8],
          "#p": [recipientPubkey],
          limit: 100,
        })

        if (!mounted) return

        // Extraer los badge IDs y agrupar por badge
        const parsedAwards: BadgeAward[] = []
        const badgeMap = new Map<string, { kind: number; pubkey: string; identifier: string }>()

        Array.from(awardEvents).forEach((event) => {
          const aTag = event.tags.find((tag) => tag[0] === "a")
          if (aTag && aTag[1]) {
            parsedAwards.push({
              badgeId: aTag[1],
              awardedBy: event.pubkey,
              awardedAt: event.created_at || 0,
            })

            // Parsear badge ID solo una vez
            const parts = aTag[1].split(":")
            if (parts.length >= 3) {
              const [kindStr, pubkey, ...identifierParts] = parts
              const kind = Number.parseInt(kindStr, 10)
              const identifier = identifierParts.join(":")
              
              if (!isNaN(kind) && pubkey && identifier) {
                badgeMap.set(aTag[1], { kind, pubkey, identifier })
              }
            }
          }
        })

        setAwards(parsedAwards)

        // Si no hay badges, terminar aquí
        if (badgeMap.size === 0) {
          setAwardedBadges([])
          setIsLoading(false)
          return
        }

        // Agrupar badges por autor para hacer menos queries
        const authorMap = new Map<string, Array<{ kind: number; identifier: string; badgeId: string }>>()
        
        badgeMap.forEach((value, badgeId) => {
          const existing = authorMap.get(value.pubkey) || []
          existing.push({ kind: value.kind, identifier: value.identifier, badgeId })
          authorMap.set(value.pubkey, existing)
        })

        // Hacer un fetch por autor en vez de uno por badge
        const badgePromises = Array.from(authorMap.entries()).map(async ([author, badges]) => {
          try {
            const identifiers = badges.map(b => b.identifier)
            const kinds = [...new Set(badges.map(b => b.kind))]
            
            const badgeEvents = await ndk.fetchEvents({
              kinds,
              authors: [author],
              "#d": identifiers,
            })

            return Array.from(badgeEvents)
          } catch (error) {
            console.error(`Failed to fetch badges from ${author}:`, error)
            return []
          }
        })

        const allBadgeEvents = (await Promise.all(badgePromises)).flat()
        
        if (!mounted) return

        // Parsear los badges
        const badges: Badge[] = allBadgeEvents
          .filter((event) => event)
          .map((event) => {
            const getTag = (tagName: string): string | undefined => {
              const tag = event.tags.find((t) => t[0] === tagName)
              return tag ? tag[1] : undefined
            }

            const identifier = getTag("d") || ""
            return {
              id: `${event.kind}:${event.pubkey}:${identifier}`,
              identifier,
              name: getTag("name") || "Unnamed Badge",
              description: getTag("description") || "",
              image: getTag("image") || "",
              thumb: getTag("thumb"),
              creator: event.pubkey,
              createdAt: event.created_at || 0,
              event,
            }
          })

        setAwardedBadges(badges)
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

  return { awards, awardedBadges, isLoading }
}