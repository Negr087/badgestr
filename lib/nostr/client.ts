import { SimplePool, type Event, type Filter  } from "nostr-tools"  // Usar Filter de nostr-tools
import { getRelayList } from "./relays"
import type { NostrEvent, BadgeDefinition, ProfileBadges } from "./types"

class NostrClient {
  private pool: SimplePool
  private relays: string[]

  constructor() {
    this.pool = new SimplePool()
    this.relays = getRelayList()
  }

  // Subscribe to events with filters (accept a single Filter or an array of Filters)
  async subscribe(filters: Filter | Filter[], onEvent: (event: NostrEvent) => void, onEose?: () => void): Promise<() => void> {
    // The underlying SimplePool API expects a "filter" parameter whose
    // runtime shape can be a Filter or an array of Filters. The package
    // types sometimes expect a single Filter which causes TS errors when
    // we pass Filter[]. Accept both here and cast to the expected type
    // at the call site.
    const sub = this.pool.subscribeMany(
      this.relays,
      // Cast via unknown -> Filter to avoid using `any` while still
      // satisfying the pool signature when runtime accepts arrays.
      filters as unknown as Filter,
      {
        onevent(event) {
          onEvent(event as NostrEvent)
        },
        oneose() {
          if (onEose) onEose()
        },
      }
    )

    return () => {
      sub.close()
    }
  }

  // Fetch badge definitions (kind 30009)
async fetchBadgeDefinitions(authors?: string[], limit = 50): Promise<BadgeDefinition[]> {
  const filter: Filter = {
    kinds: [30009],
    authors,
    limit,
  }

  const events = await this.pool.querySync(this.relays, filter)  // SIN array []
  return events as BadgeDefinition[]
}

  // Fetch profile badges for a user (kind 30008)
async fetchProfileBadges(pubkey: string): Promise<ProfileBadges | null> {
  const filter: Filter = {
    kinds: [30008],
    authors: [pubkey],
    limit: 1,
  }

  const events = await this.pool.querySync(this.relays, filter)  // SIN array []
  return events.length > 0 ? (events[0] as ProfileBadges) : null
}

  // Fetch badge awards (kind 8) for a specific badge
async fetchBadgeAwards(badgeId: string, limit = 100): Promise<NostrEvent[]> {
  const filter: Filter = {
    kinds: [8],
    "#a": [badgeId],
    limit,
  }

  const events = await this.pool.querySync(this.relays, filter)  // SIN array []
  return events as NostrEvent[]
}

  // Publish an event to relays
  async publish(event: NostrEvent): Promise<void> {
    await Promise.any(this.pool.publish(this.relays, event as Event))
  }

  // Get a single event by ID
async getEvent(id: string): Promise<NostrEvent | null> {
  const filter: Filter = {
    ids: [id],
    limit: 1,
  }

  const events = await this.pool.querySync(this.relays, filter)  // SIN array []
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