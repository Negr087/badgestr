"use client"
import { useBadges } from "@/hooks/use-badges"
import { BadgeCard } from "@/components/badge-card"
import { Card } from "@/components/ui/card"
import { BadgeCheck, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Badge } from "@/hooks/use-badges"
import type { ProfileBadge } from "@/lib/nostr/profile-badges"

interface BadgesGridProps {
  authorPubkey?: string
  badges?: Badge[]
  isLoading?: boolean
  showWearButton?: boolean
  profileBadges?: ProfileBadge[]
  onBadgeClick?: (badgeId: string) => void
  onWearToggle?: () => Promise<void>
}

export function BadgesGrid({
  authorPubkey,
  badges: externalBadges,
  isLoading: externalLoading,
  showWearButton = false,
  profileBadges = [],
  onBadgeClick,
  onWearToggle,
}: BadgesGridProps) {
  const { badges: fetchedBadges, isLoading: fetchLoading, error } = useBadges(
    externalBadges ? undefined : authorPubkey
  )
  
  const badges = externalBadges || fetchedBadges
  const isLoading = externalLoading !== undefined ? externalLoading : fetchLoading
  
  // Extraer solo badgeIds
  const wornBadgeIds = profileBadges.map(b => b.badgeId)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading badges from Nostr relays...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Failed to Load Badges</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </Card>
    )
  }

  if (badges.length === 0) {
    return (
      <Card className="p-12 text-center space-y-4">
        <BadgeCheck className="h-16 w-16 text-muted-foreground/50 mx-auto" />
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">No Badges Found</h3>
          <p className="text-muted-foreground text-pretty">
            {authorPubkey
              ? "This user hasn't created any badges yet."
              : "No badges found on the network. Be the first to create one!"}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {badges.map((badge) => (
        <BadgeCard
          key={badge.id}
          badge={badge}
          onClick={() => onBadgeClick?.(badge.id)}
          showWearButton={showWearButton}
          isWorn={wornBadgeIds.includes(badge.id)}
          profileBadges={profileBadges}
          onWearToggle={onWearToggle}
        />
      ))}
    </div>
  )
}