import { NDK, NDKKind } from "@nostr-dev-kit/ndk"

async function main() {
  const pubkey = process.argv[2]
  if (!pubkey) {
    console.error("Usage: node scripts/check-profile-badges.mjs <pubkey>")
    process.exit(1)
  }

  const ndk = new NDK({ explicitRelayUrls: [
    "wss://relay.damus.io",
    "wss://relay.nostr.band",
    "wss://nos.lol",
    "wss://nostr.mom",
    "wss://relay.primal.net",
    "wss://relay.snort.social",
    "wss://nostr.wine",
    "wss://purplepag.es",
    "wss://relay.nostr.bg",
    "wss://nostr-pub.wellorder.net",
  ] })
  await ndk.connect()

  try {
    const events = await ndk.fetchEvents({ kinds: [NDKKind.ProfileBadge], authors: [pubkey], "#d": ["profile_badges"], limit: 1 })
    const ev = Array.from(events)[0]
    if (!ev) {
      console.log("No profile-badges event found for", pubkey)
      process.exit(0)
    }
    console.log("Found event id:", ev.id)
    console.log("Tags:", ev.tags.filter(t => t[0] === 'a').map(t => t[1]))
  } finally {
    ndk.close()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
