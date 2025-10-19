"use client"

import { Card } from "@/components/ui/card"
import type { Badge as BadgeType } from "@/hooks/use-badges"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BadgeCheck } from "lucide-react"
import Image from "next/image"
import { useProfile } from "@/hooks/use-profile"

interface BadgeCardProps {
  badge: BadgeType
  onClick?: () => void
}

function isValidUrl(string: string): boolean {
  
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

export function BadgeCard({ badge, onClick }: BadgeCardProps) {
  const { profile } = useProfile(badge.creator)
  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      onClick={onClick}
    >
      <div className="aspect-square relative bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-6">
        {badge.image?.trim() && isValidUrl(badge.image.trim()) ? (
          <Image
            src={badge.image.trim()}
            alt={badge.name}
            width={96}
            height={96}
            className="w-full h-full object-contain transition-transform group-hover:scale-110"
          />
        ) : (
          <BadgeCheck className="w-24 h-24 text-primary/20" />
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1 text-balance">{badge.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 text-pretty">{badge.description}</p>

        <div className="flex items-center gap-2 pt-2 border-t">
  <Avatar className="h-6 w-6">
    <AvatarImage src={profile?.picture} alt={profile?.name || "Creator"} />
    <AvatarFallback>
      {badge.creator.slice(0, 2).toUpperCase()}
    </AvatarFallback>
  </Avatar>
  <span className="text-xs text-muted-foreground truncate">
    {profile?.display_name || profile?.name || `${badge.creator.substring(0, 8)}...`}
  </span>
</div>
      </div>
    </Card>
  )
}