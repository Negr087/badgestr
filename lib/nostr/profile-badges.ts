import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { normalizeBadgeId } from "@/lib/nostr/badge-id"
import type NDK from "@nostr-dev-kit/ndk"

// AGREGAR: Interface para badges en perfil
export interface ProfileBadge {
  badgeId: string
  awardId: string
}

// Obtener los badges que el usuario está "wearing"
export async function getProfileBadges(ndk: NDK, pubkey: string): Promise<ProfileBadge[]> {
  try {
    const events = await ndk.fetchEvents({
      kinds: [NDKKind.ProfileBadge],
      authors: [pubkey],
      limit: 10,
    })

    // Filtrar por d-tag y ORDENAR por created_at
    const profileBadgeEvents = Array.from(events)
      .filter((event) => {
        const dTag = event.tags.find((tag) => tag[0] === "d")
        return dTag && dTag[1] === "profile_badges"
      })
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))

    if (profileBadgeEvents.length === 0) {
      console.log("No profile badge event found")
      return []
    }

    const profileBadgeEvent = profileBadgeEvents[0]

    // CAMBIAR: Extraer tanto "a" como "e" tags en pares
    const badges: ProfileBadge[] = []
    const aTags: string[] = []
    const eTags: string[] = []
    
    profileBadgeEvent.tags.forEach((tag) => {
      if (tag[0] === "a") aTags.push(tag[1])
      if (tag[0] === "e") eTags.push(tag[1])
    })
    
    // Emparejar tags "a" y "e" (asumiendo que van en orden)
    for (let i = 0; i < Math.min(aTags.length, eTags.length); i++) {
      badges.push({
        badgeId: aTags[i],
        awardId: eTags[i],
      })
    }
    
    console.log("Found profile badges (from most recent event):", badges)
    return badges
  } catch (error) {
    console.error("Failed to fetch profile badges:", error)
    return []
  }
}

// CAMBIAR: Agregar o remover un badge del perfil
export async function toggleProfileBadge(
  ndk: NDK,
  badgeId: string,
  awardId: string,
  action: "add" | "remove",
  currentBadges: ProfileBadge[]
): Promise<void> {
  if (!ndk.signer) {
    throw new Error("Signer required to update profile badges")
  }

  try {
    const user = await ndk.signer.user()
    
    console.log("Current badges (from state):", currentBadges)
    console.log("Badge to toggle:", badgeId, "action:", action)

    let updatedBadges: ProfileBadge[]
    if (action === "add") {
      if (currentBadges.find(b => b.badgeId === badgeId)) {
        console.log("Badge already exists, not adding")
        return
      }
      updatedBadges = [...currentBadges, { badgeId, awardId }]
    } else {
      updatedBadges = currentBadges.filter((b) => b.badgeId !== badgeId)
    }

    console.log("Updated badges:", updatedBadges)

    // Crear evento kind 30008
    const event = new NDKEvent(ndk)
    event.kind = NDKKind.ProfileBadge
    event.tags = [["d", "profile_badges"]]

    // CAMBIAR: Agregar tags "a" Y "e" en pares
    updatedBadges.forEach(({ badgeId, awardId }) => {
      event.tags.push(["a", normalizeBadgeId(badgeId)])
      event.tags.push(["e", awardId])
    })
    event.content = ""

    console.log("Publishing event with tags:", event.tags)
    await event.sign()
    await event.publish()
    console.log("Published profile-badges event id:", event.id)

    // Retry loop
    const filter = {
      kinds: [NDKKind.ProfileBadge],
      authors: [user.pubkey],
      limit: 10,
    }

    let found = false
    for (let i = 0; i < 6; i++) {
      try {
        const events = await ndk.fetchEvents(filter)
        if (events && events.size > 0) {
          const profileBadgeEvent = Array.from(events).find((e) => {
            const dTag = e.tags.find((tag) => tag[0] === "d")
            return dTag && dTag[1] === "profile_badges"
          })

          if (profileBadgeEvent) {
            try {
              const ids = Array.from(events).map((e) => e.id)
              console.log("Observed profile-badges events:", ids)
            } catch {
              // ignore error when logging event IDs
            }
            found = true
            break
          }
        }
      } catch {
        // ignore fetch errors and retry
      }
      await new Promise((res) => setTimeout(res, 100 * Math.pow(2, i)))
    }

    if (!found) {
      console.warn("Published profile-badges event not found after retries; it may take longer to propagate")
    } else {
      console.log("Event published and observed on relays")
    }
  } catch (error) {
    console.error("Error in toggleProfileBadge:", error)
    throw error
  }
}