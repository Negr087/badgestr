"use client"

import { useState, useEffect } from "react"
import { useNDK } from "@/components/nostr-provider"
import { NDKKind } from "@nostr-dev-kit/ndk"
import type { ProfileMetadata } from "@/lib/nostr/types"

export function useProfile(pubkey: string | undefined | null) {
  const [profile, setProfile] = useState<ProfileMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { ndk } = useNDK()

  useEffect(() => {
  if (!pubkey) {
    setProfile(null)
    setIsLoading(false)
    return
  }

  let mounted = true

  async function fetchProfile() {
    if (!pubkey) return // Esta línea extra ayuda con TypeScript
    
    try {
      setIsLoading(true)

      const events = await ndk.fetchEvents({
        kinds: [NDKKind.Metadata],
        authors: [pubkey], // Ahora TypeScript sabe que no es null/undefined
        limit: 1,
      })

        if (!mounted) return

        if (events.size > 0) {
          const event = Array.from(events)[0]
          const metadata = JSON.parse(event.content) as ProfileMetadata
          setProfile(metadata)
        } else {
          setProfile(null)
        }
      } catch (err) {
        if (!mounted) return
        console.error("Failed to fetch profile:", err)
        setProfile(null)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchProfile()

    return () => {
      mounted = false
    }
  }, [pubkey, ndk])

  return { profile, isLoading }
}