"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Badge as BadgeType } from "@/hooks/use-badges"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BadgeCheck, Eye, EyeOff, Loader2 } from "lucide-react"
import Image from "next/image"
import { useProfile } from "@/hooks/use-profile"
import { toggleProfileBadge, type ProfileBadge } from "@/lib/nostr/profile-badges"
import { useNostr, useNDK } from "@/components/nostr-provider"
import { useToast } from "@/hooks/use-toast"

interface BadgeCardProps {
  badge: BadgeType & { awardId?: string }
  onClick?: () => void
  showWearButton?: boolean
  onWearToggle?: () => Promise<void>
  isWorn?: boolean
  profileBadges?: ProfileBadge[]
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (e) {
    void e
    return false
  }
}

export function BadgeCard({ 
  badge, 
  onClick, 
  showWearButton = false,
  onWearToggle,
  isWorn = false,
  profileBadges = [],
}: BadgeCardProps) {
  const { profile } = useProfile(badge.creator)
  const { user } = useNostr()
  const { ndk } = useNDK()
  const { toast } = useToast()
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleWear = async (e: React.MouseEvent) => {
  e.stopPropagation()
  
  if (!user || !badge.awardId) return

  setIsToggling(true)
  try {
    await toggleProfileBadge(
      ndk, 
      badge.id, 
      badge.awardId,
      isWorn ? "remove" : "add", 
      profileBadges
    )
      
      if (onWearToggle) {
      await onWearToggle()
    }
      
      toast({
        title: isWorn ? "Badge hidden" : "Badge visible",
        description: isWorn
          ? "Badge removed from your profile"
          : "Badge added to your profile",
      })
    } catch (error) {
      console.error("Error toggling badge:", error)
      toast({
        title: "Error",
        description: "Failed to update badge visibility",
        variant: "destructive",
      })
    } finally {
      setIsToggling(false)
    }
  }

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
        
        {showWearButton && (
          <Button
            onClick={handleToggleWear}
            disabled={isToggling}
            variant={isWorn ? "default" : "outline"}
            size="sm"
            className="w-full mt-2"
          >
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isWorn ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Visible on Profile
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Show on Profile
              </>
            )}
          </Button>
        )}
        
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