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

// ✨ إعدادات الـ PWA الأساسية
export const metadata: Metadata = {
  title: "Nexora Pro",
  description: "Premium Medical & Clinic Management System",
  // إعدادات خاصة للأيفون عشان يتعامل مع الموقع كتطبيق Native
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // يخلي الـ Status Bar شفاف ومدمج مع تصميمك
    title: "Nexora Pro",
  },
}

// لون الـ Status Bar في المتصفح وأثناء الـ Splash Screen
export const viewport: Viewport = {
  themeColor: "#5BC0BE", // اللون البريميوم بتاعك
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* إضافة ?v=2 عشان نخلي المتصفح يهمل الكاش */}
        <link rel="icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeScript />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}