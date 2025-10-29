"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AmberCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    console.log("Amber callback received")
    console.log("Full URL:", window.location.href)
    console.log("Search params:", Object.fromEntries(searchParams.entries()))

    // Obtener la pubkey de los parámetros de la URL
    // Amber puede retornar la pubkey de diferentes formas
    const signature = searchParams.get('signature')
    const event = searchParams.get('event')
    const result = searchParams.get('result')
    
    console.log("Amber response:", { signature, event, result })

    // Extraer la pubkey del resultado
    let pubkey: string | null = null

    if (result) {
      try {
        const resultData = JSON.parse(decodeURIComponent(result))
        pubkey = resultData.pubkey || resultData.npub
      } catch (e) {
        console.error("Failed to parse result:", e)
      }
    }

    if (event) {
      try {
        const eventData = JSON.parse(decodeURIComponent(event))
        pubkey = eventData.pubkey
      } catch (e) {
        console.error("Failed to parse event:", e)
      }
    }

    // También buscar en el pathname (por si Amber concatenó todo)
    if (!pubkey) {
      const pathname = window.location.pathname
      // Buscar algo que parezca una pubkey (64 caracteres hex)
      const hexMatch = pathname.match(/[0-9a-f]{64}/i)
      if (hexMatch) {
        pubkey = hexMatch[0]
      }
    }

    console.log("Extracted pubkey:", pubkey)

    if (pubkey) {
      // Guardar la pubkey que nos dio Amber
      localStorage.setItem("amber_pubkey", pubkey)
      localStorage.setItem("amber_authorized", "true")
    } else {
      console.error("No pubkey found in Amber response")
      localStorage.setItem("amber_error", "No pubkey received from Amber")
    }

    // Limpiar pending flag
    localStorage.removeItem("amber_pending")

    // Redirigir a home
    setTimeout(() => {
      router.push("/")
    }, 500)
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" />
        <h1 className="text-3xl font-bold">Processing Amber Response</h1>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}