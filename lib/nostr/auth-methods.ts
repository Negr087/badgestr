import { nip19, type EventTemplate } from "nostr-tools"
import NDK, { NDKNip46Signer, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk"

export type AuthMethod = "extension" | "bunker" | "amber" | "readonly"

export interface AuthResult {
  pubkey: string
  npub: string
  method: AuthMethod
  bunkerUrl?: string
}

// Helper to wait for extension to load
async function waitForExtension(timeout = 3000): Promise<boolean> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (typeof window !== "undefined" && (window as Window & { nostr?: unknown }).nostr) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return false
}

// NIP-07 Extension (Alby, nos2x, etc.)
export async function loginWithExtension(): Promise<AuthResult> {
  if (typeof window === "undefined") {
    throw new Error("Not in browser environment")
  }

  // Wait for extension to load
  const hasExtension = await waitForExtension()

  if (!hasExtension || !(window as Window & { nostr?: unknown }).nostr) {
    throw new Error("No Nostr extension found. Please install Alby, nos2x, or another NIP-07 extension.")
  }

  const pubkey = await (window as Window & { nostr?: { getPublicKey: () => Promise<string> } }).nostr!.getPublicKey()
  const npub = nip19.npubEncode(pubkey)

  return {
    pubkey,
    npub,
    method: "extension",
  }
}

// Store bunker signer globally
let bunkerSigner: NDKNip46Signer | null = null

// NIP-46 Nostr Connect (nsec.app, Noauth, etc.)
export async function loginWithBunker(bunkerUrl: string): Promise<AuthResult> {
  try {
    console.log("Bunker URL recibida:", bunkerUrl)
    
    // Parse the bunker URL (format: bunker://<pubkey>?relay=<relay>&secret=<secret>)
    const url = new URL(bunkerUrl)
    
    console.log("Protocol:", url.protocol)
    console.log("Hostname:", url.hostname)
    console.log("Pathname:", url.pathname)
    console.log("Search params:", url.searchParams.toString())

    if (url.protocol !== "bunker:" && url.protocol !== "nostrconnect:") {
      throw new Error("Invalid bunker URL. Must start with bunker:// or nostrconnect://")
    }

    // Intenta obtener el pubkey de diferentes formas
    let remotePubkey = url.hostname
    if (!remotePubkey || remotePubkey === "") {
      // Intenta desde pathname (formato: bunker://pubkey o bunker:pubkey)
      remotePubkey = url.pathname.replace(/^\/+/, "")
    }

    console.log("Remote pubkey extraído:", remotePubkey)

    const relay = url.searchParams.get("relay")
    const secret = url.searchParams.get("secret")

    console.log("Relay:", relay)
    console.log("Has secret:", !!secret)

    if (!remotePubkey || !relay) {
      throw new Error("Invalid bunker URL. Missing pubkey or relay.")
    }

    // Initialize NDK for bunker connection
    const ndk = new NDK({
      explicitRelayUrls: [relay],
      enableOutboxModel: false,
      autoConnectUserRelays: false
    })

    await ndk.connect()

    // Create local signer (ephemeral key for this session)
    const localSigner = NDKPrivateKeySigner.generate()

    // Create bunker signer
    bunkerSigner = new NDKNip46Signer(ndk, remotePubkey, localSigner)

    // Try to get user info without blockUntilReady to avoid CORS
    let pubkey: string
    try {
      const user = await bunkerSigner.user()
      pubkey = user.pubkey
    } catch {
      // If user() fails due to CORS, use the pubkey from URL
      pubkey = remotePubkey
    }

    const npub = nip19.npubEncode(pubkey)

    // Store bunker connection info
    localStorage.setItem("nostr_bunker_url", bunkerUrl)
    localStorage.setItem("nostr_bunker_relay", relay)
    localStorage.setItem("nostr_bunker_pubkey", pubkey)
    if (secret) {
      localStorage.setItem("nostr_bunker_secret", secret)
    }

    return {
      pubkey,
      npub,
      method: "bunker",
      bunkerUrl,
    }
  } catch (error) {
    console.error("Bunker login error:", error)
    throw new Error("Failed to connect with bunker: " + (error as Error).message)
  }
}

// Reconnect to bunker on page load
export async function reconnectBunker(): Promise<void> {
  const bunkerUrl = localStorage.getItem("nostr_bunker_url")
  const relay = localStorage.getItem("nostr_bunker_relay")
  const pubkey = localStorage.getItem("nostr_bunker_pubkey")
  const secret = localStorage.getItem("nostr_bunker_secret")

  if (!bunkerUrl || !relay || !pubkey) {
    return
  }

  try {
    const ndk = new NDK({
      explicitRelayUrls: [relay],
      enableOutboxModel: false,
      autoConnectUserRelays: false
    })

    await ndk.connect()

    const localSigner = NDKPrivateKeySigner.generate()
    bunkerSigner = new NDKNip46Signer(ndk, pubkey, localSigner)

    // Try to get user info without blockUntilReady to avoid CORS
    try {
      await bunkerSigner.user()
    } catch {
      // If user() fails due to CORS, continue anyway
    }
  } catch (error) {
    console.error("Failed to reconnect bunker:", error)
    bunkerSigner = null
  }
}

// Amber (Android NIP-55)
export async function loginWithAmber(): Promise<AuthResult> {
  const isAndroid = /Android/i.test(navigator.userAgent)

  if (!isAndroid) {
    throw new Error("Amber is only available on Android devices")
  }

  const hasExtension = await waitForExtension()
  
  if (!hasExtension || !(window as Window & { nostr?: unknown }).nostr) {
    throw new Error("Amber not found. Please install Amber from F-Droid or Google Play.")
  }

  try {
    const pubkey = await (window as Window & { nostr?: { getPublicKey: () => Promise<string> } }).nostr!.getPublicKey()
    const npub = nip19.npubEncode(pubkey)

    return {
      pubkey,
      npub,
      method: "amber",
    }
  } catch (error) {
    throw new Error("Failed to connect to Amber: " + (error as Error).message)
  }
}

// Read-only login with npub
export async function loginReadOnly(npubOrHex: string): Promise<AuthResult> {
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

    return {
      pubkey,
      npub,
      method: "readonly",
    }
  } catch (error) {
    throw new Error("Invalid public key: " + (error as Error).message)
  }
}

// Login with nsec (private key)
export async function loginWithNsec(nsecOrHex: string): Promise<AuthResult> {
  try {
    let privateKey: string

    if (nsecOrHex.startsWith("nsec1")) {
      const decoded = nip19.decode(nsecOrHex)
      if (decoded.type !== "nsec") {
        throw new Error("Invalid nsec")
      }
      privateKey = Buffer.from(decoded.data).toString('hex')
    } else if (/^[0-9a-f]{64}$/i.test(nsecOrHex)) {
      privateKey = nsecOrHex.toLowerCase()
    } else {
      throw new Error("Invalid private key format. Use nsec or hex format.")
    }

    const signer = new NDKPrivateKeySigner(privateKey)
    const user = await signer.user()
    const pubkey = user.pubkey
    const npub = nip19.npubEncode(pubkey)

    // Store for later use
    localStorage.setItem("nostr_nsec", nsecOrHex)

    return {
      pubkey,
      npub,
      method: "extension", // Tratamos nsec como extension ya que firma localmente
    }
  } catch (error) {
    throw new Error("Invalid private key: " + (error as Error).message)
  }
}

// Sign event based on auth method
export async function signEventWithMethod(event: EventTemplate, method: AuthMethod): Promise<EventTemplate> {
  switch (method) {
    case "extension":
    case "amber":
      if (typeof window !== "undefined" && (window as Window & { nostr?: unknown }).nostr) {
        return await (window as Window & { nostr?: { signEvent: (event: EventTemplate) => Promise<EventTemplate> } }).nostr!.signEvent(event)
      }
      throw new Error("Nostr extension not available")

    case "bunker":
      if (!bunkerSigner) {
        // Try to reconnect
        await reconnectBunker()
        if (!bunkerSigner) {
          throw new Error("Bunker connection lost. Please login again.")
        }
      }

      try {
        // Recupera el pubkey guardado en localStorage
        const storedPubkey = localStorage.getItem("nostr_bunker_pubkey")
        if (!storedPubkey) {
          throw new Error("Bunker pubkey not found")
        }

        const { NDKEvent } = await import("@nostr-dev-kit/ndk")
        const ndkEvent = new NDKEvent(undefined, event)
        ndkEvent.kind = event.kind
        ndkEvent.content = event.content
        ndkEvent.tags = event.tags
        ndkEvent.created_at = event.created_at
        ndkEvent.pubkey = storedPubkey

        // Firma el evento
        await ndkEvent.sign(bunkerSigner)

        // Retorna el evento firmado
        return ndkEvent.rawEvent()
      } catch (error) {
        console.error("Bunker signing error:", error)
        throw new Error("Failed to sign with bunker: " + (error as Error).message)
      }

    case "readonly":
      throw new Error("Cannot sign events in read-only mode")

    default:
      throw new Error("Unknown auth method")
  }
}

// Export bunker signer getter for debugging
export function getBunkerSigner() {
  return bunkerSigner
}