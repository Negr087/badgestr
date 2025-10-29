"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AmberCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Extraer parámetros de la URL si Amber los envió
    const params = new URLSearchParams(window.location.search)
    
    // Marcar que Amber fue autorizado
    localStorage.setItem("amber_authorized", "true")
    
    // Redirigir de vuelta a la home
    router.push("/")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Connecting with Amber...</h1>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  )
}