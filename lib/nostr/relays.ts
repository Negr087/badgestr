export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
  "wss://relay.snort.social",
  "wss://nostr.wine",
  "wss://relay.primal.net",
]

export function getRelayList(): string[] {
  if (typeof window === "undefined") return DEFAULT_RELAYS

  const saved = localStorage.getItem("nostr_relays")
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return DEFAULT_RELAYS
    }
  }

  return DEFAULT_RELAYS
}

export function saveRelayList(relays: string[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem("nostr_relays", JSON.stringify(relays))
}