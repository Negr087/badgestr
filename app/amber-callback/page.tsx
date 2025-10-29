"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AmberCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    console.log("Amber callback page loaded")
    console.log("window.nostr available:", !!window.nostr)
    
    // Marcar que Amber fue autorizado
    localStorage.setItem("amber_authorized", "true")
    
    // Dar más tiempo para que Amber inyecte window.nostr
    const timer = setTimeout(() => {
      console.log("Redirecting to home...")
      console.log("window.nostr available before redirect:", !!window.nostr)
      router.push("/")
    }, 1500) // Aumentado a 1.5 segundos

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" />
        <h1 className="text-3xl font-bold">Connecting with Amber</h1>
        <p className="text-muted-foreground">Completing authentication...</p>
        <p className="text-xs text-muted-foreground/60">Preparing your connection...</p>
      </div>
    </div>
  )
}