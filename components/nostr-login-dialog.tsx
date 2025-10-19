"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Smartphone, Link2, Eye, Puzzle, AlertCircle, Loader2, Key } from "lucide-react"
import { useNostr } from "@/components/nostr-provider"
import { useToast } from "@/hooks/use-toast"

interface NostrLoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NostrLoginDialog({ open, onOpenChange }: NostrLoginDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bunkerUrl, setBunkerUrl] = useState("")
  const [readOnlyKey, setReadOnlyKey] = useState("")
  const [nsecKey, setNsecKey] = useState("")
  const { loginWithNip07, loginWithNip46, loginWithNsec, loginWithAmber, loginReadOnly } = useNostr()
  const { toast } = useToast()

  const handleExtensionLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await loginWithNip07()
      toast({
        title: "Connected!",
        description: "Successfully connected with browser extension",
      })
      onOpenChange(false)
    } catch (err) {
      setError((err as Error).message || "Failed to connect with extension")
    } finally {
      setLoading(false)
    }
  }

  const handleBunkerLogin = async () => {
    if (!bunkerUrl.trim()) {
      setError("Please enter a bunker URL")
      return
    }

    setLoading(true)
    setError(null)
    try {
      await loginWithNip46(bunkerUrl)
      toast({
        title: "Connected!",
        description: "Successfully connected with nsec bunker",
      })
      onOpenChange(false)
    } catch (err) {
      setError((err as Error).message || "Failed to connect with bunker")
    } finally {
      setLoading(false)
    }
  }

  const handleNsecLogin = async () => {
    if (!nsecKey.trim()) {
      setError("Please enter your nsec key")
      return
    }

    setLoading(true)
    setError(null)
    try {
      await loginWithNsec(nsecKey)
      toast({
        title: "Connected!",
        description: "Successfully connected with nsec key",
      })
      onOpenChange(false)
      setNsecKey("") // Clear the key from memory
    } catch (err) {
      setError((err as Error).message || "Failed to connect with nsec")
    } finally {
      setLoading(false)
    }
  }

  const handleAmberLogin = async () => {
  setLoading(true)
  setError(null)
  try {
    await loginWithAmber()
    toast({
      title: "Connected!",
      description: "Successfully connected with Amber",
    })
    onOpenChange(false)
  } catch (err) {
    setError((err as Error).message || "Failed to connect with Amber")
  } finally {
    setLoading(false)
  }
}

  const handleReadOnlyLogin = async () => {
  if (!readOnlyKey.trim()) {
    setError("Please enter a public key")
    return
  }

  setLoading(true)
  setError(null)
  try {
    await loginReadOnly(readOnlyKey)
    toast({
      title: "Connected!",
      description: "Browsing in read-only mode",
    })
    onOpenChange(false)
  } catch (err) {
    setError((err as Error).message || "Failed to connect in read-only mode")
  } finally {
    setLoading(false)
  }
}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Connect to Nostr</DialogTitle>
          <DialogDescription>Choose your preferred authentication method</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="extension" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="extension" className="text-xs">
              <Puzzle className="h-4 w-4 mr-1" />
              Extension
            </TabsTrigger>
            <TabsTrigger value="bunker" className="text-xs">
              <Link2 className="h-4 w-4 mr-1" />
              Bunker
            </TabsTrigger>
            <TabsTrigger value="nsec" className="text-xs">
              <Key className="h-4 w-4 mr-1" />
              Nsec
            </TabsTrigger>
            <TabsTrigger value="amber" className="text-xs">
              <Smartphone className="h-4 w-4 mr-1" />
              Amber
            </TabsTrigger>
            <TabsTrigger value="readonly" className="text-xs">
              <Eye className="h-4 w-4 mr-1" />
              Read-only
            </TabsTrigger>
          </TabsList>

          <TabsContent value="extension" className="space-y-4 mt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Connect using a browser extension like Alby, nos2x, or other NIP-07 compatible extensions.
              </p>
              <Button onClick={handleExtensionLogin} disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Puzzle className="mr-2 h-4 w-4" />
                    Connect Extension
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="bunker" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="bunker-url">Bunker URL</Label>
                <Input
                  id="bunker-url"
                  placeholder="bunker://pubkey?relay=wss://relay.nsec.app"
                  value={bunkerUrl}
                  onChange={(e) => setBunkerUrl(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Get your bunker URL from nsec.app, Noauth, or other NIP-46 providers
                </p>
              </div>
              <Button onClick={handleBunkerLogin} disabled={loading || !bunkerUrl} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Connect Bunker
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="nsec" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="nsec-key">Private Key (nsec)</Label>
                <Input
                  id="nsec-key"
                  type="password"
                  placeholder="nsec1..."
                  value={nsecKey}
                  onChange={(e) => setNsecKey(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Your private key never leaves your browser. Use with caution.
                </p>
              </div>
              <Button onClick={handleNsecLogin} disabled={loading || !nsecKey} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Connect with Nsec
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="amber" className="space-y-4 mt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Connect using Amber, the Android Nostr signer app (NIP-55). Make sure Amber is installed on your device.
              </p>
              <Button onClick={handleAmberLogin} disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Connect Amber
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="readonly" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="readonly-key">Public Key (npub or hex)</Label>
                <Input
                  id="readonly-key"
                  placeholder="npub1... or hex public key"
                  value={readOnlyKey}
                  onChange={(e) => setReadOnlyKey(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Browse badges without signing. You won&apos;t be able to create or award badges.
                </p>
              </div>
              <Button onClick={handleReadOnlyLogin} disabled={loading || !readOnlyKey} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Browse Read-only
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}