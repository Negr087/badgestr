"use client"

import { useState, useEffect } from "react"
import { useNDK } from "@/components/nostr-provider"
import { NDKKind, type NDKEvent } from "@nostr-dev-kit/ndk"

export interface Badge {
  id: string
  identifier: string
  name: string
  description: string
  image: string
  thumb?: string
  creator: string
  createdAt: number
  event: NDKEvent
}

function parseBadgeFromEvent(event: NDKEvent): Badge {
  const getTag = (tagName: string): string | undefined => {
    const tag = event.tags.find((t) => t[0] === tagName)
    return tag ? tag[1] : undefined
  }

  const identifier = getTag("d") || ""
  const name = getTag("name") || "Unnamed Badge"
  const description = getTag("description") || ""
  const image = getTag("image") || ""
  const thumb = getTag("thumb")

  return {
    id: `${NDKKind.BadgeDefinition}:${event.pubkey}:${identifier}`,
    identifier,
    name,
    description,
    image,
    thumb,
    creator: event.pubkey,
    createdAt: event.created_at || 0,
    event,
  }
}

export function useBadges(authorPubkey?: string) {
  const [badges, setBadges] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { ndk } = useNDK()

  useEffect(() => {
    let mounted = true

    async function fetchBadges() {
      try {
        setIsLoading(true)
        setError(null)

        const filter: {
          kinds: NDKKind[]
          limit: number
          authors?: string[]
        } = {
          kinds: [NDKKind.BadgeDefinition],
          limit: 100,
        }

        if (authorPubkey) {
          filter.authors = [authorPubkey]
        }

        const events = await ndk.fetchEvents(filter)

        if (!mounted) return

        const parsedBadges: Badge[] = Array.from(events).map(parseBadgeFromEvent)

        // Sort by creation date (newest first)
        parsedBadges.sort((a, b) => b.createdAt - a.createdAt)

        setBadges(parsedBadges)
      } catch (err) {
        if (!mounted) return
        console.error("Failed to fetch badges:", err)
        setError("Failed to load badges")
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchBadges()

    return () => {
      mounted = false
    }
  }, [authorPubkey, ndk])

  const refetch = () => {
    setIsLoading(true)
    // Trigger re-fetch by updating a dependency
  }

  return { badges, isLoading, error, refetch }
}