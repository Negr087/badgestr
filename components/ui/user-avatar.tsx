"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useProfile } from "@/hooks/use-profile"

interface UserAvatarProps {
  pubkey: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function UserAvatar({ pubkey, size = "md", className }: UserAvatarProps) {
  const { profile } = useProfile(pubkey)

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  const fallbackText = pubkey.slice(0, 2).toUpperCase()

  return (
    <Avatar className={`${sizeClasses[size]} ${className || ""}`}>
      <AvatarImage src={profile?.picture} alt={profile?.name || "User"} />
      <AvatarFallback>{fallbackText}</AvatarFallback>
    </Avatar>
  )
}