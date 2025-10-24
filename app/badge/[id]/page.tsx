"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useNostr } from "@/components/nostr-provider"
import { useNDK } from "@/components/nostr-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge as BadgeType } from "@/hooks/use-badges"
import { BadgeCheck, Loader2, Award, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { UserAvatar } from "@/components/ui/user-avatar"
import { UserDisplayName } from "@/components/ui/user-display-name"
import Link from "next/link"
import { nip19 } from "nostr-tools"

export default function BadgePage() {
  const params = useParams()
  const id = params.id as string
  const { user, ndk: userNdk } = useNostr()
  const { ndk } = useNDK()
  const [badge, setBadge] = useState<BadgeType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [npubOrNip05, setNpubOrNip05] = useState("")
  const [recipientPubkey, setRecipientPubkey] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchBadge() {
      try {
        const [kindStr, pubkey, ...identifierParts] = decodeURIComponent(id).split(":")
        const kind = Number.parseInt(kindStr, 10)
        const identifier = identifierParts.join(":")

        if (isNaN(kind) || !pubkey || !identifier) {
          throw new Error("Invalid badge ID")
        }

        const events = await ndk.fetchEvents({
          kinds: [kind],
          authors: [pubkey],
          "#d": [identifier],
          limit: 1,
        })

        const event = Array.from(events)[0]
        if (!event) {
          throw new Error("Badge not found")
        }

        const getTag = (tagName: string): string | undefined => {
          const tag = event.tags.find((t) => t[0] === tagName)
          return tag ? tag[1] : undefined
        }

        setBadge({
          id: `${event.kind}:${event.pubkey}:${identifier}`,
          identifier,
          name: getTag("name") || "Unnamed Badge",
          description: getTag("description") || "",
          image: getTag("image") || "",
          thumb: getTag("thumb"),
          creator: event.pubkey,
          createdAt: event.created_at || 0,
          event,
        })
      } catch (error) {
        console.error("Failed to fetch badge:", error)
        toast({
          title: "Error",
          description: "Failed to load badge",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBadge()
  }, [id, ndk, toast])

  // Si el usuario ya está logueado, usar su pubkey
  useEffect(() => {
  if (user?.pubkey) {
    setRecipientPubkey(user.pubkey)  // ✓ Esto YA está bien
    setNpubOrNip05(user.npub || nip19.npubEncode(user.pubkey))  // ✓ Esto también
  }
}, [user])

  const handleValidateInput = async () => {
  console.log("🚀 handleValidateInput called with:", npubOrNip05)  // AGREGAR
  try {
    const input = npubOrNip05.trim()

    // Validar npub
    if (input.startsWith("npub1")) {
      const decoded = nip19.decode(input)
      if (decoded.type !== "npub") {
        throw new Error("Invalid npub format")
      }
      const pubkeyHex = decoded.data as string
      console.log("✅ npub decoded to:", pubkeyHex)  // AGREGAR
      setRecipientPubkey(pubkeyHex)
      toast({
        title: "Valid npub",
        description: "You can now claim the badge",
      })
      return
    }

      // Validar NIP-05
if (input.includes("@")) {
      console.log("🔍 Validating NIP-05:", input)  // AGREGAR
      const [name, domain] = input.split("@")
      const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`)
      const data = await response.json()
      
      console.log("📦 NIP-05 response:", data)  // AGREGAR
      
      if (data.names && data.names[name]) {
        const pubkeyHex = data.names[name]
        console.log("✅ NIP-05 resolved to:", pubkeyHex)  // AGREGAR
        setRecipientPubkey(pubkeyHex)
        toast({
          title: "Valid NIP-05",
          description: "You can now claim the badge",
        })
        return
      }
      throw new Error("NIP-05 not found")
    }

      // Validar hex pubkey
      if (/^[0-9a-f]{64}$/i.test(input)) {
        setRecipientPubkey(input.toLowerCase())
        toast({
          title: "Valid pubkey",
          description: "You can now claim the badge",
        })
        return
      }

      throw new Error("Invalid format. Use npub, NIP-05, or hex pubkey")
    } catch (error) {
      console.error("❌ Validation error:", error)
      toast({
        title: "Invalid input",
        description: (error as Error).message,
        variant: "destructive",
      })
      setRecipientPubkey(null)
    }
  }

  const handleClaim = async () => {
  if (!badge || !recipientPubkey) return

  if (!/^[0-9a-f]{64}$/i.test(recipientPubkey)) {
    toast({
      title: "Invalid pubkey",
      description: "Please validate your input first",
      variant: "destructive",
    })
    return
  }

   setIsClaiming(true)
  try {
    const response = await fetch("/api/claim-badge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        badgeId: badge.id,
        recipientPubkey,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to claim badge")
    }

    setClaimSuccess(true)
    toast({
      title: "Badge claimed!",
      description: "The badge has been awarded to your account",
    })
  } catch (error) {
    console.error("Failed to claim badge:", error)
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to claim badge",
      variant: "destructive",
    })
  } finally {
    setIsClaiming(false)
  }
}

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!badge) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center space-y-4 max-w-md">
          <BadgeCheck className="h-16 w-16 text-muted-foreground/50 mx-auto" />
          <h1 className="text-2xl font-bold">Badge Not Found</h1>
          <p className="text-muted-foreground">This badge doesn&apos;t exist or has been removed.</p>
          <Button asChild>
            <Link href="/">Browse Badges</Link>
          </Button>
        </Card>
      </div>
    )
  }

  if (claimSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/10">
        <Card className="p-8 text-center space-y-6 max-w-md">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Badge Claimed!</h1>
            <p className="text-muted-foreground">
              {userNdk?.signer
                ? "The badge has been awarded to your account"
                : "The badge creator will send it to you. Check your Nostr client later."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Browse More Badges</Link>
            </Button>
            {user && (
              <Button asChild className="flex-1">
                <Link href="/">View My Badges</Link>
              </Button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
          ← Back to badges
        </Link>

        <div className="grid md:grid-cols-2 gap-8 mt-6">
          {/* Badge Image */}
          <Card className="p-8 space-y-6">
            <div className="aspect-square relative bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg flex items-center justify-center p-8">
              {badge.image ? (
                <Image
                  src={badge.image.trim()}
                  alt={badge.name}
                  width={256}
                  height={256}
                  className="w-full h-full object-contain"
                />
              ) : (
                <BadgeCheck className="w-32 h-32 text-primary/20" />
              )}
            </div>
          </Card>

          {/* Badge Info & Claim Form */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold">{badge.name}</h1>
              <p className="text-lg text-muted-foreground">{badge.description}</p>
            </div>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <UserAvatar pubkey={badge.creator} size="md" />
                <div>
                  <p className="text-sm text-muted-foreground">Created by</p>
                  <UserDisplayName pubkey={badge.creator} className="font-medium" />
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Claim this Badge</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your npub or NIP-05 identifier to claim this badge
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="npub">Your npub or NIP-05</Label>
                  <div className="flex gap-2">
                    <Input
                      id="npub"
                      placeholder="npub1... or user@domain.com"
                      value={npubOrNip05}
                      onChange={(e) => setNpubOrNip05(e.target.value)}
                      disabled={!!user}
                    />
                    {!recipientPubkey && !user && (
                      <Button onClick={handleValidateInput} variant="outline">
                        Validate
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user
                      ? "Using your logged-in account"
                      : "We'll send the badge to this Nostr identity"}
                  </p>
                </div>

                <Button
                  onClick={handleClaim}
                  disabled={!recipientPubkey || isClaiming}
                  size="lg"
                  className="w-full"
                >
                  {isClaiming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Award className="mr-2 h-4 w-4" />
                      Claim Badge
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}