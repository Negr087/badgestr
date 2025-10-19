"use client"

import { useProfile } from "@/hooks/use-profile"
import { nip19 } from "nostr-tools"

interface UserDisplayNameProps {
  pubkey: string
  showNpub?: boolean
  className?: string
}

export function UserDisplayName({ pubkey, showNpub = false, className }: UserDisplayNameProps) {
  const { profile, isLoading } = useProfile(pubkey)

  if (isLoading) {
    return <span className={className}>Loading...</span>
  }

  const displayName = profile?.display_name || profile?.name
  const npub = nip19.npubEncode(pubkey)
  const shortNpub = `${npub.slice(0, 8)}...${npub.slice(-4)}`

  return (
    <span className={className}>
      {displayName || shortNpub}
      {showNpub && displayName && (
        <span className="text-muted-foreground text-xs ml-1">({shortNpub})</span>
      )}
    </span>
  )
}