import { NextRequest, NextResponse } from "next/server"
import { nip19, getPublicKey, finalizeEvent, generateSecretKey } from "nostr-tools"
import NDK, { NDKEvent } from "@nostr-dev-kit/ndk"

export async function POST(request: NextRequest) {
  try {
    const { badgeId, recipientPubkey } = await request.json()

    // Validar inputs
    if (!badgeId || !recipientPubkey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!/^[0-9a-f]{64}$/i.test(recipientPubkey)) {
      return NextResponse.json({ error: "Invalid pubkey format" }, { status: 400 })
    }

    // TU NSEC DEL CREADOR (guardala en .env.local)
    const creatorNsec = process.env.CREATOR_NSEC
    if (!creatorNsec) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Decodificar nsec
    const decoded = nip19.decode(creatorNsec)
    if (decoded.type !== "nsec") {
      return NextResponse.json({ error: "Invalid nsec" }, { status: 500 })
    }

    const privateKey = decoded.data

    // Crear evento kind 8
    const event = {
      kind: 8,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ["a", badgeId],
        ["p", recipientPubkey],
      ],
      content: "",
    }

    // Firmar evento
    const signedEvent = finalizeEvent(event, privateKey)

    // Publicar en relays
    const ndk = new NDK({
      explicitRelayUrls: [
        "wss://relay.damus.io",
        "wss://relay.nostr.band",
        "wss://nos.lol",
      ],
    })
    await ndk.connect()

    const ndkEvent = new NDKEvent(ndk, signedEvent)
    await ndkEvent.publish()

    return NextResponse.json({ success: true, eventId: signedEvent.id })
  } catch (error) {
    console.error("Error claiming badge:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}