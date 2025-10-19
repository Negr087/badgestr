// Nostr event types based on NIP-01 and NIP-58
export interface NostrEvent {
  id: string
  pubkey: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
  sig: string
}

// Badge Definition Event (kind 30009) - NIP-58
export interface BadgeDefinition extends NostrEvent {
  kind: 30009
  // Tags include: d (identifier), name, description, image, thumb
}

// Profile Badges Event (kind 30008) - NIP-58
export interface ProfileBadges extends NostrEvent {
  kind: 30008
  // Tags include: d (identifier), a (badge references), e (award event references)
}

// Badge Award Event (kind 8) - NIP-58
export interface BadgeAward extends NostrEvent {
  kind: 8
  // Tags include: a (badge definition), p (recipient pubkeys)
}

export interface RelayMessage {
  type: "EVENT" | "EOSE" | "NOTICE" | "OK"
  subscriptionId?: string
  event?: NostrEvent
  message?: string
}

export interface Filter {
  ids?: string[]
  authors?: string[]
  kinds?: number[]
  "#d"?: string[]
  "#a"?: string[]
  "#p"?: string[]
  since?: number
  until?: number
  limit?: number
}

// User Profile Metadata (kind 0) - NIP-01
export interface ProfileMetadata {
  name?: string
  display_name?: string
  picture?: string
  banner?: string
  about?: string
  nip05?: string
  lud06?: string
  lud16?: string
  website?: string
}

export interface ProfileEvent extends NostrEvent {
  kind: 0
}