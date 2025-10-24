"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Badge as BadgeType } from "@/hooks/use-badges"
import type { BadgeWithAward } from "@/hooks/use-badge-awards"
import { QRCodeSVG } from "qrcode.react"
import { Download, Copy, Award, BadgeCheck, Calendar } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useNostr } from "@/components/nostr-provider"
import { useProfile } from "@/hooks/use-profile"
import Image from "next/image"

interface BadgeDetailModalProps {
  badge: BadgeType | BadgeWithAward | null  // ← Permitir ambos tipos
  open: boolean
  onOpenChange: (open: boolean) => void
  onAwardClick?: (badge: BadgeType | BadgeWithAward) => void  // ← Aquí también
}

export function BadgeDetailModal({ badge, open, onOpenChange, onAwardClick }: BadgeDetailModalProps) {
  const [qrSize] = useState(256)
  const { toast } = useToast()
  const { user } = useNostr()
  const { profile: creatorProfile } = useProfile(badge?.creator)

  if (!badge) return null

  const badgeUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/badge/${encodeURIComponent(badge.id)}`
  const isCreator = user?.pubkey === badge.creator

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(badgeUrl)
      toast({
        title: "Copied!",
        description: "Badge URL copied to clipboard",
      })
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleDownloadQR = () => {
    const svg = document.getElementById("badge-qr-code")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = document.createElement('img')

    img.onload = () => {
      canvas.width = qrSize
      canvas.height = qrSize
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL("image/png")

      const downloadLink = document.createElement("a")
      downloadLink.download = `${badge.identifier}-qr.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = "data:image/svg+xml;base64," + btoa(svgData)
  }

  const handleCopyBadgeId = async () => {
    try {
      await navigator.clipboard.writeText(badge.id)
      toast({
        title: "Copied!",
        description: "Badge ID copied to clipboard",
      })
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-balance">{badge.name}</DialogTitle>
          <DialogDescription className="text-pretty">{badge.description}</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
          {/* Badge Image */}
          <div className="space-y-4">
            <Card className="aspect-square relative bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-8">
              {badge.image ? (
                <Image
                  src={badge.image?.trim() || "/placeholder.svg"}
                  alt={badge.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-contain"
                />
              ) : (
                <BadgeCheck className="w-32 h-32 text-primary/20" />
              )}
            </Card>

            {/* Creator Info */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-3">
  <Avatar className="h-10 w-10">
    <AvatarImage src={creatorProfile?.picture} alt={creatorProfile?.name || "Creator"} />
    <AvatarFallback>
      {badge.creator.slice(0, 2).toUpperCase()}
    </AvatarFallback>
  </Avatar>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium">Created by</p>
    <p className="text-xs text-muted-foreground truncate">
      {creatorProfile?.display_name || creatorProfile?.name || `${badge.creator.substring(0, 16)}...`}
    </p>
  </div>
</div>

              <Separator />

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(badge.createdAt * 1000), "PPP")}</span>
              </div>
            </Card>
          </div>

          {/* QR Code Section - Solo para creador */}
          {isCreator && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Share this QR code so people can claim this badge
                </p>
              </div>

              <div className="flex justify-center bg-white rounded-lg p-4 border-2 border-border">
                <QRCodeSVG
                  id="badge-qr-code"
                  value={badgeUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleDownloadQR} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download QR
                </Button>
                <Button onClick={handleCopyUrl} variant="outline" size="sm" className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy URL
                </Button>
              </div>

              <Separator />

              {/* Badge ID e Identifier para creador */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Badge ID</h4>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">{badge.id}</code>
                  <Button onClick={handleCopyBadgeId} variant="ghost" size="icon" className="shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Identifier</h4>
                <code className="block text-xs bg-muted p-2 rounded font-mono">{badge.identifier}</code>
              </div>
            </div>
          )}
          {/* Si NO eres el creador - solo mostrar info */}
{!isCreator && (
  <div className="space-y-4">

              {/* Badge ID e Identifier para no-creador */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Badge ID</h4>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">{badge.id}</code>
                  <Button onClick={handleCopyBadgeId} variant="ghost" size="icon" className="shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Identifier</h4>
                <code className="block text-xs bg-muted p-2 rounded font-mono">{badge.identifier}</code>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {isCreator && (
            <Button
              onClick={() => {
                onAwardClick?.(badge)
                onOpenChange(false)
              }}
              className="gap-2"
            >
              <Award className="h-4 w-4" />
              Award Badge
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}