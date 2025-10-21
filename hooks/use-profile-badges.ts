"use client"

import { useState, useEffect } from "react"
import { useNDK } from "@/components/nostr-provider"
import { normalizeBadgeId } from "@/lib/nostr/badge-id"
import type { ProfileBadge } from "@/lib/nostr/profile-badges"

export function useProfileBadges(userPubkey: string | null | undefined) {
  const [profileBadges, setProfileBadges] = useState<ProfileBadge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { ndk } = useNDK()

  const refetch = async () => {
    if (!userPubkey || !ndk) return
    
    await new Promise(r => setTimeout(r, 1000))
    
    try {
      const events = await ndk.fetchEvents({
        kinds: [30008],
        authors: [userPubkey],
        limit: 10,
      })

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
    }
  }

  useEffect(() => {
    if (!userPubkey) {
      setProfileBadges([])
      setIsLoading(false)
      return
    }

    refetch()
  }, [userPubkey, ndk])

  return { profileBadges, isLoading, refetch }
}