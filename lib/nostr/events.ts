import type { EventTemplate } from "nostr-tools"
import type { NostrEvent, BadgeDefinition } from "./types"
import { signEventWithMethod, type AuthMethod } from "./auth-methods"

// Create a badge definition event (kind 30009)
export async function createBadgeDefinition(
  params: {
    identifier: string
    name: string
    description: string
    image: string
    thumb?: string
  },
  method: AuthMethod
): Promise<any> {
  const tags: string[][] = [
    ["d", params.identifier],
    ["name", params.name],
    ["description", params.description],
    ["image", params.image],
  ]

  if (params.thumb) {
    tags.push(["thumb", params.thumb])
  }

  const eventTemplate: EventTemplate = {
    kind: 30009,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: "",
  }

  return signEventWithMethod(eventTemplate, method)
}

// Create a badge award event (kind 8)
export async function createBadgeAward(
  params: {
    badgeDefinitionId: string
    recipientPubkeys: string[]
  },
  method: AuthMethod
): Promise<any> {
  const tags: string[][] = [["a", params.badgeDefinitionId]]

  params.recipientPubkeys.forEach((pubkey) => {
    tags.push(["p", pubkey])
  })

  const eventTemplate: EventTemplate = {
    kind: 8,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: "",
  }

  return signEventWithMethod(eventTemplate, method)
}

// Parse badge definition from event
export function parseBadgeDefinition(event: BadgeDefinition): {
  identifier: string
  name: string
  description: string
  image: string
  thumb?: string
  creator: string
  createdAt: number
} {
  const getTag = (tagName: string): string | undefined => {
    const tag = event.tags.find((t) => t[0] === tagName)
    return tag ? tag[1] : undefined
  }

  return {
    identifier: getTag("d") || "",
    name: getTag("name") || "Unnamed Badge",
    description: getTag("description") || "",
    image: getTag("image") || "",
    thumb: getTag("thumb"),
    creator: event.pubkey,
    createdAt: event.created_at,
  }
}

// Get badge definition ID in the format "30009:pubkey:identifier"
export function getBadgeDefinitionId(event: BadgeDefinition): string {
  const identifier = event.tags.find((t) => t[0] === "d")?.[1] || ""
  return `30009:${event.pubkey}:${identifier}`
}