import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Atma } from "next/font/google"
import { Oi } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

const atma = Atma({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-atma",
  display: "swap",
})

const oi = Oi({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-oi",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Obi - Learn Crypto",
  description: "Learn crypto. Slow and steady.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${atma.variable} ${oi.variable}`}>{children}</body>
    </html>
  )
}
