"use client"

import { useNostr } from "@/components/nostr-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BadgeCheck, LogOut, User, Plus } from "lucide-react"
import { useProfile } from "@/hooks/use-profile"

interface HeaderProps {
  onCreateBadge?: () => void
  onShowMyBadges?: () => void
  onShowMyAwards?: () => void
  onShowAll?: () => void  // AGREGAR
}

export function Header({ onCreateBadge, onShowMyBadges, onShowMyAwards, onShowAll }: HeaderProps) {
  const { user, logout } = useNostr()
  const { profile } = useProfile(user?.pubkey)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div 
          onClick={onShowAll}  // USAR la función
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <BadgeCheck className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Nostr Badgy</span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <Button onClick={onCreateBadge} variant="default" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Badge
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
  <AvatarImage src={profile?.picture} alt={profile?.name || "User"} />
  <AvatarFallback>
    {user.pubkey.slice(0, 2).toUpperCase()}
  </AvatarFallback>
</Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
  <div className="flex flex-col gap-1">
    <span className="text-sm font-medium">
      {profile?.display_name || profile?.name || "Anonymous"}
    </span>
    <span className="text-xs text-muted-foreground font-mono">
      {user.npub.substring(0, 16)}...
    </span>
  </div>
</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onShowMyBadges}>
  <User className="mr-2 h-4 w-4" />
  My Badges
</DropdownMenuItem>
<DropdownMenuItem onClick={onShowMyAwards}>
  <BadgeCheck className="mr-2 h-4 w-4" />
  My Awards
</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  )
}