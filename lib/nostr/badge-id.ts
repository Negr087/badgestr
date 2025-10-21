export function normalizeBadgeIdentifier(identifier: string): string {
  // Trim and collapse whitespace; keep existing punctuation/dashes intact.
  return identifier.trim().replace(/\s+/g, " ")
}

export function normalizeBadgeId(badgeId: string): string {
  // Expect format: `${kind}:${pubkey}:${identifier}`. Normalize pubkey to lowercase
  // and trim/normalize identifier whitespace.
  if (!badgeId) return badgeId
  const parts = badgeId.split(":")
  if (parts.length < 3) return badgeId
  const kind = parts[0]
  const pubkey = parts[1].toLowerCase()
  const identifier = parts.slice(2).join(":")
  return `${kind}:${pubkey}:${normalizeBadgeIdentifier(identifier)}`
}

export function buildBadgeId(kind: number, pubkey: string, identifier: string): string {
  return `${kind}:${pubkey.toLowerCase()}:${normalizeBadgeIdentifier(identifier)}`
}
