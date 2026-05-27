import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { Providers } from "@/components/providers"

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
      <head>
        {/* 
          هذا السكريبت الصغير يمنع وميض الثيم (FOUC) عند تحميل الصفحة.
          وضعه في الـ head داخل Server Component مسموح به في React 19 
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('eyadti-ui-theme') === 'dark' || ((!localStorage.getItem('eyadti-ui-theme') || localStorage.getItem('eyadti-ui-theme') === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
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