import { SimplePool, type Event, type Filter as NostrFilter } from "nostr-tools"
import { getRelayList } from "./relays"
import type { NostrEvent, BadgeDefinition, ProfileBadges } from "./types"

class NostrClient {
  private pool: SimplePool
  private relays: string[]

  constructor() {
    this.pool = new SimplePool()
    this.relays = getRelayList()
  }

  // Subscribe to events with filters
  async subscribe(filters: NostrFilter[], onEvent: (event: NostrEvent) => void, onEose?: () => void): Promise<() => void> {
  const sub = this.pool.subscribeMany(
  this.relays,
  filters as any,
  {
      onevent(event) {
        onEvent(event as NostrEvent)
      },
      oneose() {
        if (onEose) onEose()
      },
    }
  )

    // Return unsubscribe function
    return () => {
      sub.close()
    }
  }

  // Fetch badge definitions (kind 30009)
  async fetchBadgeDefinitions(authors?: string[], limit = 50): Promise<BadgeDefinition[]> {
  const filters: NostrFilter[] = [
    {
      kinds: [30009],
      authors,
      limit,
    },
  ]
  const events = await this.pool.querySync(this.relays, filters as any)
  return events as BadgeDefinition[]
}

  // Fetch profile badges for a user (kind 30008)
  async fetchProfileBadges(pubkey: string): Promise<ProfileBadges | null> {
    const filters: NostrFilter[] = [
      {
        kinds: [30008],
        authors: [pubkey],
        limit: 1,
      },
    ]

    const events = await this.pool.querySync(this.relays, filters as any)
    return events.length > 0 ? (events[0] as ProfileBadges) : null
  }

  // Fetch badge awards (kind 8) for a specific badge
  async fetchBadgeAwards(badgeId: string, limit = 100): Promise<NostrEvent[]> {
    const filters: NostrFilter[] = [
      {
        kinds: [8],
        "#a": [badgeId],
        limit,
      },
    ]

    const events = await this.pool.querySync(this.relays, filters as any)
    return events as NostrEvent[]
  }

  // Publish an event to relays
  async publish(event: NostrEvent): Promise<void> {
    await Promise.any(this.pool.publish(this.relays, event as Event))
  }

  // Get a single event by ID
  async getEvent(id: string): Promise<NostrEvent | null> {
    const filters: NostrFilter[] = [
      {
        ids: [id],
        limit: 1,
      },
    ]

    const events = await this.pool.querySync(this.relays, filters as any)
    return events.length > 0 ? (events[0] as NostrEvent) : null
  }

  // Close all connections
  close(): void {
    this.pool.close(this.relays)
  }
}

// Singleton instance
let clientInstance: NostrClient | null = null

export function getNostrClient(): NostrClient {
  if (!clientInstance) {
    clientInstance = new NostrClient()
  }
  return clientInstance
}

export { NostrClient }