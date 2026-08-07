import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { ThemeScript } from "@/components/theme-script"
import { LangProvider } from "@/lib/i18n-context" // ⬅️ إضافة الـ Provider

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Nexora Pro",
  description: "Premium Medical & Clinic Management System",
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
        
        {/* ⬇️⬇️⬇️ سكريبت سريع جداً عشان يمنع ظهور الإنجليزي لمضة واحدة لما تكون اللغة عربي ⬇️⬇⬇️ */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var lang = localStorage.getItem('nexora-lang');
                if (lang === 'ar') {
                  document.documentElement.lang = 'ar';
                  document.documentElement.dir = 'rtl';
                }
              } catch(e) {}
            })()
          `
        }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeScript />
        <Providers>
          <LangProvider>{children}</LangProvider> {/* ⬅️ تغليف التطبيق باللغات */}
        </Providers>
      </body>
    </html>
  )
}