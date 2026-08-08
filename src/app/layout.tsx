// src/app/layout.tsx
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { ThemeScript } from "@/components/theme-script"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

// ✨ إعدادات الـ PWA والـ SEO الأساسية
export const metadata: Metadata = {
  title: "Nexora Pro",
  description: "Premium Medical & Clinic Management System",
  // إعدادات الـ Open Graph للرئيسية
  openGraph: {
    title: "Nexora Pro - Medical Clinic Management",
    description: "Premium Medical & Clinic Management System",
    type: "website",
    locale: "en_US",
    siteName: "Nexora Pro",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexora Pro",
  },
}

export const viewport: Viewport = {
  themeColor: "#5BC0BE",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.png?v=2" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeScript />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}