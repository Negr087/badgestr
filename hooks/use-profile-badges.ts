"use client"

import { useState, useEffect, useCallback } from "react"
import { useNDK } from "@/components/nostr-provider"
import { normalizeBadgeId } from "@/lib/nostr/badge-id"
import type { ProfileBadge } from "@/lib/nostr/profile-badges"

export function useProfileBadges(userPubkey: string | null | undefined) {
  const [profileBadges, setProfileBadges] = useState<ProfileBadge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { ndk } = useNDK()

  const refetch = useCallback(async () => {
  if (!userPubkey || !ndk) return

    setIsLoading(true)

    try {
      console.log("Fetching profile badges for:", userPubkey)
      const eventsPromise = ndk.fetchEvents({
        kinds: [30008],
        authors: [userPubkey],
        limit: 5, // Reducir límite ya que solo necesitamos el más reciente
      })

      // Timeout para evitar loading eterno
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile badges fetch timeout')), 8000)
      )

      const events = await Promise.race([eventsPromise, timeoutPromise])
      console.log("Found profile badge events:", events.size)

      const profileBadgeEvents = Array.from(events)
        .filter((e: any) => {
          const dTag = e.tags.find((tag: any) => tag[0] === "d")
          return dTag && dTag[1] === "profile_badges"
        })
        .sort((a: any, b: any) => (b.created_at || 0) - (a.created_at || 0))

      if (profileBadgeEvents.length === 0) {
        console.log("No profile badge event found")
        setProfileBadges([])
        return
      }

      const profileBadgeEvent = profileBadgeEvents[0]

      // Extraer badges en pares (a, e)
      const badges: ProfileBadge[] = []
      const aTags: string[] = []
      const eTags: string[] = []
      
      profileBadgeEvent.tags.forEach((tag: any) => {
        if (tag[0] === "a") aTags.push(normalizeBadgeId(tag[1]))
        if (tag[0] === "e") eTags.push(tag[1])
      })
      
      for (let i = 0; i < Math.min(aTags.length, eTags.length); i++) {
        badges.push({
          badgeId: aTags[i],
          awardId: eTags[i],
        })
      }
      
      console.log("Refetched profile badges:", badges)
      setProfileBadges(badges)
    } catch (err) {
    console.error("Failed to refetch profile badges:", err)
    setProfileBadges([]) // Set empty array on error
  } finally {
    setIsLoading(false)
  }
}, [userPubkey, ndk])

  useEffect(() => {
    if (!userPubkey) {
      setProfileBadges([])
      setIsLoading(false)
      return
    }

    refetch()
  }, [userPubkey, ndk, refetch])

  return { profileBadges, isLoading, refetch }
}