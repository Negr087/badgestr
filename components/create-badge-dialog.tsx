"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useNDK } from "@/components/nostr-provider"
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { Loader2, BadgeCheck } from "lucide-react"
import Image from "next/image"

interface CreateBadgeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateBadgeDialog({ open, onOpenChange, onSuccess }: CreateBadgeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    identifier: "",
    name: "",
    description: "",
    image: "",
    thumb: "",
  })
  const { toast } = useToast()
  const { ndk } = useNDK()

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Verificar que hay un signer disponible
  if (!ndk.signer) {
    toast({
      title: "Authentication required",
      description: "Please log in again to create badges",
      variant: "destructive",
    })
    return
  }
  
  setIsSubmitting(true)

    try {
      const event = new NDKEvent(ndk)
      event.kind = NDKKind.BadgeDefinition
      event.tags = [
  ["d", formData.identifier.trim()],
  ["name", formData.name.trim()],
  ["description", formData.description.trim()],
  ["image", formData.image.trim()],
]

      if (formData.thumb?.trim()) {
  event.tags.push(["thumb", formData.thumb.trim()])
}

      event.content = ""

      await event.sign()
      await event.publish()

      toast({
        title: "Badge Created!",
        description: "Your badge has been published to Nostr relays",
      })

      setFormData({
        identifier: "",
        name: "",
        description: "",
        image: "",
        thumb: "",
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to create badge:", error)
      toast({
        title: "Failed to create badge",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-primary" />
            Create New Badge
          </DialogTitle>
          <DialogDescription>Design a new badge to award to members of the Nostr community</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">
              Identifier <span className="text-destructive">*</span>
            </Label>
            <Input
              id="identifier"
              placeholder="my-awesome-badge"
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              required
              pattern="[a-z0-9_\-]+"
              title="Only lowercase letters, numbers, and hyphens"
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for this badge (lowercase, numbers, and hyphens only)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Badge Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Awesome Contributor"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Awarded to outstanding contributors who go above and beyond..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">
              Image URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="image"
              type="url"
              placeholder="https://example.com/badge-image.png"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">Full-size badge image (recommended: 512x512px or larger)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumb">Thumbnail URL (Optional)</Label>
            <Input
              id="thumb"
              type="url"
              placeholder="https://example.com/badge-thumb.png"
              value={formData.thumb}
              onChange={(e) => setFormData({ ...formData, thumb: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Smaller thumbnail version (recommended: 256x256px)</p>
          </div>

          {formData.image && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="aspect-square max-w-xs bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg flex items-center justify-center p-8">
                <Image
                  src={formData.image?.trim() || "/placeholder.svg"}
                  alt="Badge preview"
                  width={128}
                  height={128}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Create Badge
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}