"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import NDK, { NDKNip07Signer, NDKPrivateKeySigner, NDKNip46Signer } from "@nostr-dev-kit/ndk"
import { nip19 } from "nostr-tools"
import { DEFAULT_RELAYS } from "@/lib/nostr/relays"

interface NostrUser {
  pubkey: string
  npub: string
}

interface NostrContextType {
  user: NostrUser | null
  ndk: NDK
  login: (user: NostrUser) => void
  logout: () => void
  isLoading: boolean
  loginWithNip07: () => Promise<void>
  loginWithNip46: (bunkerUrl: string) => Promise<void>
  loginWithNsec: (nsec: string) => Promise<void>
  loginWithAmber: () => Promise<void>
  loginReadOnly: (npubOrHex: string) => Promise<void>
}

const NostrContext = createContext<NostrContextType | undefined>(undefined)

export function NostrProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NostrUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [ndk] = useState<NDK>(() => {
  const ndkInstance = new NDK({
    explicitRelayUrls: DEFAULT_RELAYS,
    enableOutboxModel: false,
    autoConnectUserRelays: false,
  })

  return ndkInstance
})

  useEffect(() => {
  async function initialize() {
    try {
      // Connect to relays
      await ndk.connect()

      // Check if user is already logged in
      const savedPubkey = localStorage.getItem("nostr_pubkey")
      const savedNpub = localStorage.getItem("nostr_npub")
      const savedMethod = localStorage.getItem("nostr_method")

      if (savedPubkey && savedNpub && savedMethod) {
        // Try to restore session based on method
        if (savedMethod === "nip07" || savedMethod === "amber") {
          try {
            if (window.nostr) {
              const signer = new NDKNip07Signer()
              ndk.signer = signer
              const signerUser = await signer.user()
              if (signerUser.pubkey === savedPubkey) {
                setUser({ pubkey: savedPubkey, npub: savedNpub })
              } else {
                // Pubkey doesn't match, clear storage
                localStorage.removeItem("nostr_pubkey")
                localStorage.removeItem("nostr_npub")
                localStorage.removeItem("nostr_method")
              }
            } else {
              // Extension not available, but keep user logged in (read-only)
              setUser({ pubkey: savedPubkey, npub: savedNpub })
            }
          } catch (err) {
            console.error("Failed to restore NIP-07 session:", err)
            // Keep user logged in even if signer fails
            setUser({ pubkey: savedPubkey, npub: savedNpub })
          }
        } else if (savedMethod === "nip46") {
          const bunkerUrl = localStorage.getItem("nostr_bunker_url")
          if (bunkerUrl) {
            try {
              const url = new URL(bunkerUrl)
              const remotePubkey = url.hostname || url.pathname.replace("//", "")
              const relayUrl = url.searchParams.get("relay")

              if (remotePubkey && relayUrl) {
                const localSigner = NDKPrivateKeySigner.generate()
                const signer = new NDKNip46Signer(ndk, remotePubkey, localSigner)
                ndk.signer = signer
                setUser({ pubkey: savedPubkey, npub: savedNpub })
              }
            } catch (err) {
              console.error("Failed to restore bunker session:", err)
              // Keep user logged in even if bunker fails
              setUser({ pubkey: savedPubkey, npub: savedNpub })
            }
          } else {
            setUser({ pubkey: savedPubkey, npub: savedNpub })
          }
        } else if (savedMethod === "nsec") {
  // Restore nsec signer from localStorage (stored encrypted would be better)
  const savedNsec = localStorage.getItem("nostr_nsec")
  if (savedNsec) {
    try {
      let privateKey: Uint8Array

      if (savedNsec.startsWith("nsec1")) {
        const decoded = nip19.decode(savedNsec)
        if (decoded.type === "nsec") {
          privateKey = decoded.data
        } else {
          throw new Error("Invalid nsec")
        }
      } else {
        privateKey = new Uint8Array(savedNsec.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)))
      }

      const signer = new NDKPrivateKeySigner(privateKey)
      ndk.signer = signer
      setUser({ pubkey: savedPubkey, npub: savedNpub })
    } catch (err) {
      console.error("Failed to restore nsec signer:", err)
      setUser({ pubkey: savedPubkey, npub: savedNpub })
    }
  } else {
    setUser({ pubkey: savedPubkey, npub: savedNpub })
  }
        } else if (savedMethod === "readonly") {
          setUser({ pubkey: savedPubkey, npub: savedNpub })
        }
      }
    } catch (error) {
      console.error("Failed to initialize NDK:", error)
    } finally {
      setIsLoading(false)
    }
  }

  initialize()
}, [ndk])

  const loginWithNip07 = async () => {
    try {
      if (!window.nostr) {
        throw new Error("NIP-07 extension not available")
      }

      const signer = new NDKNip07Signer()
      ndk.signer = signer
      const user = await ndk.signer?.user()
if (user) {
  // Fetch relays del usuario (kind 10002)
  const relayListEvents = await ndk.fetchEvents({
    kinds: [10002],
    authors: [user.pubkey],
    limit: 1,
  })
  const relayList = Array.from(relayListEvents)[0]
  if (relayList) {
    // Agregar los relays del usuario a NDK
    relayList.tags
      .filter(t => t[0] === "r")
      .forEach(t => {
        const relayUrl = t[1]
        ndk.addExplicitRelay(relayUrl)
      })
  }
}

      const npub = nip19.npubEncode(user.pubkey)
      const userData = { pubkey: user.pubkey, npub }

      setUser(userData)
      localStorage.setItem("nostr_pubkey", user.pubkey)
      localStorage.setItem("nostr_npub", npub)
      localStorage.setItem("nostr_method", "nip07")
    } catch {
      throw new Error("Failed to connect with browser extension. Make sure you have a Nostr extension installed.")
    }
  }

  const loginWithNip46 = async (bunkerUrl: string) => {
  try {
    console.log("Original bunker URL:", bunkerUrl) // DEBUG
    if (!bunkerUrl || !bunkerUrl.startsWith("bunker://")) {
      throw new Error("Invalid bunker URL format. Must start with bunker://")
    }
    
    // Limpiar el URL primero
    const cleanedUrl = bunkerUrl.trim()
    console.log("Cleaned URL:", cleanedUrl) // DEBUG
    
    // Parse manual sin usar URL()
    const withoutProtocol = cleanedUrl.substring(9) // Quitar "bunker://"
    const questionMarkIndex = withoutProtocol.indexOf("?")
   
    let remotePubkey: string
    let queryString: string
   
    if (questionMarkIndex > -1) {
      remotePubkey = withoutProtocol.substring(0, questionMarkIndex)
      queryString = withoutProtocol.substring(questionMarkIndex + 1)
    } else {
      throw new Error("No query parameters found in bunker URL")
    }
    
    console.log("Remote pubkey:", remotePubkey) // DEBUG
    console.log("Query string:", queryString) // DEBUG
    
    // Parse query params
    const params = new URLSearchParams(queryString)
    let relayUrl = params.get("relay")
    const secret = params.get("secret")
    
    // Quitar barra final del relay si existe
    if (relayUrl && relayUrl.endsWith("/")) {
      relayUrl = relayUrl.slice(0, -1)
    }
    
    console.log("Parsed:", { remotePubkey, relayUrl, secret }) // DEBUG
    
    if (!remotePubkey || remotePubkey.length !== 64) {
      throw new Error(`Invalid bunker pubkey (length: ${remotePubkey?.length})`)
    }
    
    if (!relayUrl || !relayUrl.startsWith("wss://")) {
      throw new Error("Invalid or missing relay URL")
    }
    
    // Agregar el relay del bunker a NDK primero
    ndk.addExplicitRelay(relayUrl)
    
    // Reconstruir el bunker URL limpio
    const cleanBunkerUrl = `bunker://${remotePubkey}?relay=${relayUrl}${secret ? `&secret=${secret}` : ""}`
    console.log("Clean bunker URL for signer:", cleanBunkerUrl) // DEBUG
    
    const localSigner = NDKPrivateKeySigner.generate()
    
    console.log("Creating NDKNip46Signer...") // DEBUG
    
    // Use manual constructor with proper setup to bypass NIP-05 verification
    console.log("Using manual NDKNip46Signer constructor with NIP-05 bypass...") // DEBUG

    const signer = new NDKNip46Signer(ndk, remotePubkey, localSigner)

    // Force the relay URL
    const signerAny = signer as { relayUrls?: string[] }
    if (signerAny.relayUrls) {
      signerAny.relayUrls = [relayUrl]
    }

    // Manually set the remote pubkey and user to bypass verification
    const signerProps = signer as {
      remotePubkey?: string
      remoteUser?: { pubkey: string }
      bunkerUrl?: string
      _isReady?: boolean
      blockUntilReady?: () => Promise<{ pubkey: string }>
    }
    signerProps.remotePubkey = remotePubkey
    signerProps.remoteUser = { pubkey: remotePubkey }

    // Set the bunker URL for the signer
    signerProps.bunkerUrl = cleanBunkerUrl

    // Override the blockUntilReady method to skip NIP-05 verification
    signerProps.blockUntilReady = async (): Promise<{ pubkey: string }> => {
      console.log("Custom blockUntilReady: skipping NIP-05 verification") // DEBUG
      // Manually set the required properties to simulate ready state
      signerProps._isReady = true
      // Return a mock user object
      return { pubkey: remotePubkey }
    }

    console.log("Waiting for signer to be ready...") // DEBUG
    await signer.blockUntilReady()

    console.log("Signer ready, proceeding...") // DEBUG

console.log("Signer ready, getting user...") // DEBUG
ndk.signer = signer

const user = await signer.user()
    const npub = nip19.npubEncode(user.pubkey)
    const userData = { pubkey: user.pubkey, npub }
    
    setUser(userData)
    localStorage.setItem("nostr_pubkey", user.pubkey)
    localStorage.setItem("nostr_npub", npub)
    localStorage.setItem("nostr_method", "nip46")
    localStorage.setItem("nostr_bunker_url", bunkerUrl)
    
    console.log("Bunker login successful!") // DEBUG
  } catch (error) {
    console.error("Bunker connection error:", error) // DEBUG
    throw new Error("Failed to connect with bunker: " + (error as Error).message)
  }
}

  const loginWithNsec = async (nsec: string) => {
  try {
    let privateKey: Uint8Array

    if (nsec.startsWith("nsec1")) {
      const decoded = nip19.decode(nsec)
      if (decoded.type !== "nsec") {
        throw new Error("Invalid nsec format")
      }
      privateKey = decoded.data
    } else {
      privateKey = new Uint8Array(nsec.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)))
    }

    const signer = new NDKPrivateKeySigner(privateKey)
    ndk.signer = signer
    const user = await signer.user()

    const npub = nip19.npubEncode(user.pubkey)
    const userData = { pubkey: user.pubkey, npub }

    setUser(userData)
    localStorage.setItem("nostr_pubkey", user.pubkey)
    localStorage.setItem("nostr_npub", npub)
    localStorage.setItem("nostr_method", "nsec")
    localStorage.setItem("nostr_nsec", nsec)  // AGREGAR ESTA LÍNEA
  } catch {
    throw new Error("Failed to connect with nsec. Please check your private key and try again.")
  }
}

  const loginWithAmber = async () => {
  try {
    const isAndroid = /Android/i.test(navigator.userAgent)
    
    if (!isAndroid) {
      throw new Error("Amber is only available on Android devices")
    }

    if (!window.nostr) {
      throw new Error("Amber not found. Please install Amber from F-Droid or Google Play.")
    }

    const signer = new NDKNip07Signer()
    ndk.signer = signer
    const user = await signer.user()

    const npub = nip19.npubEncode(user.pubkey)
    const userData = { pubkey: user.pubkey, npub }

    setUser(userData)
    localStorage.setItem("nostr_pubkey", user.pubkey)
    localStorage.setItem("nostr_npub", npub)
    localStorage.setItem("nostr_method", "amber")
  } catch (err) {
    throw new Error("Failed to connect with Amber: " + (err as Error).message)
  }
}

const loginReadOnly = async (npubOrHex: string) => {
  try {
    let pubkey: string

    if (npubOrHex.startsWith("npub1")) {
      const decoded = nip19.decode(npubOrHex)
      if (decoded.type !== "npub") {
        throw new Error("Invalid npub")
      }
      pubkey = decoded.data as string
    } else if (/^[0-9a-f]{64}$/i.test(npubOrHex)) {
      pubkey = npubOrHex.toLowerCase()
    } else {
      throw new Error("Invalid public key format. Use npub or hex format.")
    }

    const npub = nip19.npubEncode(pubkey)
    const userData = { pubkey, npub }

    setUser(userData)
    localStorage.setItem("nostr_pubkey", pubkey)
    localStorage.setItem("nostr_npub", npub)
    localStorage.setItem("nostr_method", "readonly")
  } catch (err) {
    throw new Error("Invalid public key: " + (err as Error).message)
  }
}

  const login = (userData: NostrUser) => {
    setUser(userData)
    localStorage.setItem("nostr_pubkey", userData.pubkey)
    localStorage.setItem("nostr_npub", userData.npub)
  }

  const logout = () => {
    setUser(null)
    ndk.signer = undefined
    localStorage.removeItem("nostr_pubkey")
    localStorage.removeItem("nostr_npub")
    localStorage.removeItem("nostr_method")
    localStorage.removeItem("nostr_bunker_url")
    localStorage.removeItem("nostr_nsec")
  }

  return (
    <NostrContext.Provider
      value={{
        user,
        ndk,
        login,
        logout,
        isLoading,
        loginWithNip07,
        loginWithNip46,
        loginWithNsec,
        loginWithAmber,
        loginReadOnly,
      }}
    >
      {children}
    </NostrContext.Provider>
  )
}

export function useNostr() {
  const context = useContext(NostrContext)
  if (context === undefined) {
    throw new Error("useNostr must be used within a NostrProvider")
  }
  return context
}

export const useNDK = useNostr