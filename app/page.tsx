"use client"

import { useNostr } from "@/components/nostr-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BadgeCheck, Sparkles, QrCode } from "lucide-react"
import { Header } from "@/components/header"
import { BadgesGrid } from "@/components/badges-grid"
import { BadgeDetailModal } from "@/components/badge-detail-modal"
import { CreateBadgeDialog } from "@/components/create-badge-dialog"
import { AwardBadgeDialog } from "@/components/award-badge-dialog"
import { NostrLoginDialog } from "@/components/nostr-login-dialog"
import { useState, useEffect } from "react"
import { useBadges } from "@/hooks/use-badges"
import { useBadgeAwards } from "@/hooks/use-badge-awards"
import { useProfileBadges } from "@/hooks/use-profile-badges"
import type { Badge } from "@/hooks/use-badges"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const { user, isLoading: userLoading, logout, ndk } = useNostr()
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [awardDialogOpen, setAwardDialogOpen] = useState(false)
  const [badgeToAward, setBadgeToAward] = useState<Badge | null>(null)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [filterMode, setFilterMode] = useState<"all" | "myBadges" | "myAwards">("all")
  const { badges, isLoading: badgesLoading } = useBadges(filterMode === "myBadges" ? user?.pubkey : undefined)
  const { toast } = useToast()
  const { awardedBadges, isLoading: awardsLoading } = useBadgeAwards(
  filterMode === "myAwards" ? user?.pubkey : undefined
)
const { profileBadges, refetch: refetchProfileBadges } = useProfileBadges(
  filterMode === "myAwards" ? user?.pubkey : undefined
)


  const [localProfileBadges, setLocalProfileBadges] = useState(profileBadges)
  
  useEffect(() => {
    setLocalProfileBadges(profileBadges)
  }, [profileBadges])

  const handleWearToggle = async () => {
    await new Promise(r => setTimeout(r, 500))
    await refetchProfileBadges()
  }

// Extraer badgeIds para filtrar (used for filtering logic)
const wornBadgeIds = profileBadges.map(b => b.badgeId)

const handleCreateBadge = () => {
    if (!ndk.signer) {
      toast({
        title: "Session expired",
        description: "Please log in again to create badges",
        variant: "destructive",
      })
      logout()
      setLoginDialogOpen(true)
      return
    }
    setCreateDialogOpen(true)
  }

// Determinar qué badges mostrar según el filtro:
const displayBadges = filterMode === "myAwards" ? awardedBadges : badges

  const selectedBadge = badges.find((b) => b.id === selectedBadgeId) || null

  const handleShowMyBadges = () => {
  setFilterMode("myBadges")
}

const handleShowMyAwards = () => {
  setFilterMode("myAwards")
  // TODO: Implementar lógica para awards
}

const handleShowAll = () => {
  setFilterMode("all")
}

  const handleAwardClick = (badge: Badge) => {
    setBadgeToAward(badge)
    setAwardDialogOpen(true)
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/10">
        <div className="max-w-2xl w-full space-y-8 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <BadgeCheck className="h-20 w-20 text-primary" />
                <Sparkles className="h-8 w-8 text-accent absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-balance">Nostr Badgy</h1>
            <p className="text-xl text-muted-foreground text-pretty">
              Create, manage, and award badges on the Nostr protocol
            </p>
          </div>

          <Card className="p-8 space-y-6 border-2 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Get Started</h2>
              <p className="text-muted-foreground">Choose your preferred way to connect to Nostr</p>
            </div>

            <Button onClick={() => setLoginDialogOpen(true)} size="lg" className="w-full text-lg h-14">
              <BadgeCheck className="mr-2 h-5 w-5" />
              Connect to Nostr
            </Button>

            <div className="pt-4 border-t space-y-3">
              <p className="text-sm text-muted-foreground">Multiple authentication methods:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                  Browser Extensions
                </span>
                <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                  Nsec Bunker
                </span>
                <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                  Amber (Android)
                </span>
                <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">Read-only</span>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-3 gap-4 pt-8">
            <Card className="p-6 space-y-2 hover:shadow-lg hover:shadow-primary/10 transition-all bg-card/50 backdrop-blur">
              <BadgeCheck className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Create Badges</h3>
              <p className="text-sm text-muted-foreground">Design custom badges with images and descriptions</p>
            </Card>
            <Card className="p-6 space-y-2 hover:shadow-lg hover:shadow-accent/10 transition-all bg-card/50 backdrop-blur">
              <QrCode className="h-8 w-8 text-accent" />
              <h3 className="font-semibold">Generate QR Codes</h3>
              <p className="text-sm text-muted-foreground">Create QR codes for easy badge claiming</p>
            </Card>
            <Card className="p-6 space-y-2 hover:shadow-lg hover:shadow-secondary/10 transition-all bg-card/50 backdrop-blur">
              <Sparkles className="h-8 w-8 text-secondary" />
              <h3 className="font-semibold">Award Badges</h3>
              <p className="text-sm text-muted-foreground">Grant badges to users on the Nostr network</p>
            </Card>
          </div>
        </div>

        <NostrLoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <Header 
  onCreateBadge={handleCreateBadge} 
  onShowMyBadges={handleShowMyBadges}
  onShowMyAwards={handleShowMyAwards}
  onShowAll={handleShowAll}
/>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-balance"></h1>
            <div className="space-y-6">
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-balance">
          {filterMode === "myBadges" ? "My Badges" : filterMode === "myAwards" ? "My Awards" : "Discover Badges"}
        </h1>
        <p className="text-lg text-muted-foreground text-pretty">
          {filterMode === "myBadges" 
            ? "Badges you've created" 
            : filterMode === "myAwards" 
            ? "Badges awarded to you" 
            : "Explore badges created by the Nostr community"}
        </p>
      </div>
      {filterMode !== "all" && (
        <Button variant="outline" onClick={handleShowAll}>
          Show All Badges
        </Button>
      )}
    </div>
  </div>
  </div>
  </div>

  <BadgesGrid 
  badges={displayBadges}
  isLoading={filterMode === "myAwards" ? awardsLoading : badgesLoading}
  showWearButton={filterMode === "myAwards"}
  profileBadges={localProfileBadges}  // ← Usar local
  onBadgeClick={setSelectedBadgeId}
  onWearToggle={filterMode === "myAwards" ? handleWearToggle : undefined}
/>
</div>
      </main>

      <BadgeDetailModal
        badge={selectedBadge}
        open={!!selectedBadgeId}
        onOpenChange={(open) => !open && setSelectedBadgeId(null)}
        onAwardClick={handleAwardClick}
      />

      <CreateBadgeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setTimeout(() => window.location.reload(), 1000)
        }}
      />

      <AwardBadgeDialog
        badge={badgeToAward}
        open={awardDialogOpen}
        onOpenChange={setAwardDialogOpen}
        onSuccess={() => {
          setBadgeToAward(null)
        }}
      />
    </div>
  )
}
