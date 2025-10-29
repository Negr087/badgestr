"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AmberCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Extraer todo de la URL
    const fullPath = window.location.pathname
    const search = window.location.search
    
    console.log("Amber callback received:", { fullPath, search })
    
    // Marcar que Amber fue autorizado
    localStorage.setItem("amber_authorized", "true")
    
    // Esperar un poco y redirigir
    setTimeout(() => {
      router.push("/")
    }, 500)
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <h1 className="text-2xl font-bold">Connecting with Amber...</h1>
        <p className="text-muted-foreground">Redirecting back to app</p>
      </div>
    </div>
  )
}