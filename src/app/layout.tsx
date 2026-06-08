import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { Providers } from "@/components/providers"
import { ThemeScript } from "@/components/theme-script" // تم الإضافة

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Eyadti System",
  description: "Premium Clinic Management System",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* الـ Component الجديد بدل الـ script */}
        <ThemeScript />
        <Providers>{children}</Providers>
        
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "16px",
              fontSize: "0.875rem",
              padding: "12px 16px",
              boxShadow: "0_15px_35px_rgba(100,116,139,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
            },
          }}
        />
      </body>
    </html>
  )
}