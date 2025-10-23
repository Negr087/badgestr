"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useNDK } from "@/components/nostr-provider"
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { Loader2, Award, Plus, X } from "lucide-react"
import type { Badge } from "@/hooks/use-badges"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { nip19 } from "nostr-tools"

interface AwardBadgeDialogProps {
  badge: Badge | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AwardBadgeDialog({ badge, open, onOpenChange, onSuccess }: AwardBadgeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recipients, setRecipients] = useState<string[]>([""])
  const { toast } = useToast()
  const { ndk } = useNDK()

  const handleAddRecipient = () => {
    setRecipients([...recipients, ""])
  }

  const handleRemoveRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index))
  }

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...recipients]
    newRecipients[index] = value
    setRecipients(newRecipients)
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!badge) return

  setIsSubmitting(true)

  try {
    const validRecipients = recipients.filter((r) => r.trim().length > 0)

    if (validRecipients.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add at least one recipient pubkey",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // ✓✓✓ AGREGAR VALIDACIÓN Y CONVERSIÓN
    const resolvedPubkeys: string[] = []
    
    for (const recipient of validRecipients) {
      const input = recipient.trim()
      let pubkeyHex: string

      // Validar npub
      if (input.startsWith("npub1")) {
        const decoded = nip19.decode(input)
        if (decoded.type !== "npub") {
          throw new Error(`Invalid npub format: ${input}`)
        }
        pubkeyHex = decoded.data as string
      }
      // Validar NIP-05
      else if (input.includes("@")) {
        const [name, domain] = input.split("@")
        const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`)
        if (!response.ok) {
          throw new Error(`Failed to resolve NIP-05: ${input}`)
        }
        const data = await response.json()
        
        if (!data.names || !data.names[name]) {
          throw new Error(`NIP-05 not found: ${input}`)
        }
        pubkeyHex = data.names[name]
      }
      // Validar hex pubkey
      else if (/^[0-9a-f]{64}$/i.test(input)) {
        pubkeyHex = input.toLowerCase()
      }
      else {
        throw new Error(`Invalid format: ${input}. Use npub, NIP-05, or hex pubkey`)
      }

      resolvedPubkeys.push(pubkeyHex)
    }

      const event = new NDKEvent(ndk)
    event.kind = NDKKind.BadgeAward
    event.tags = [["a", badge.id]]

    resolvedPubkeys.forEach((pubkey) => {
      event.tags.push(["p", pubkey])
    })

    event.content = ""

    await event.sign()
    await event.publish()

    toast({
      title: "Badge Awarded!",
      description: `Successfully awarded "${badge.name}" to ${resolvedPubkeys.length} recipient(s)`,
    })

    setRecipients([""])
    onOpenChange(false)
    onSuccess?.()
  } catch (error) {
    console.error("Failed to award badge:", error)
    toast({
      title: "Failed to award badge",
      description: error instanceof Error ? error.message : "An error occurred",
      variant: "destructive",
    })
  } finally {
    setIsSubmitting(false)
  }
}

  if (!badge) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Award Badge
          </DialogTitle>
          <DialogDescription>Award &ldquo;{badge.name}&rdquo; to Nostr users</DialogDescription>
        </DialogHeader>

        <Card className="p-4 flex items-center gap-4 my-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg flex items-center justify-center p-2 shrink-0">
            <Image src={badge.image || "/placeholder.svg"} alt={badge.name} width={64} height={64} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{badge.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{badge.description}</p>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Recipients <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRecipient}
                className="gap-2 bg-transparent"
              >
                <Plus className="h-4 w-4" />
                Add Recipient
              </Button>
            </div>

            <div className="space-y-3">
              {recipients.map((recipient, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="npub1... or hex pubkey"
                    value={recipient}
                    onChange={(e) => handleRecipientChange(index, e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                  {recipients.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRecipient(index)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Enter Nostr public keys (npub or hex format) of users you want to award this badge to
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Awarding...
                </>
              ) : (
                <>
                  <Award className="mr-2 h-4 w-4" />
                  Award Badge
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}