import type React from "react"
import type { Metadata } from "next"
// import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { NostrProvider } from "@/components/nostr-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

// const geist = Geist({ subsets: ["latin"] })
// const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Badgestr",
  description: "Create and manage badges",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <NostrProvider>{children}</NostrProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}