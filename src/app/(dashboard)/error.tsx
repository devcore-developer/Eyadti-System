"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // يمكنك إرسال الخطأ إلى خدمة مراقبة مثل Sentry
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center animate-fade">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-800/20 text-red-500 dark:text-red-400 mb-8 shadow-[0_15px_35px_rgba(239,68,68,0.15)]">
        <AlertTriangle className="h-12 w-12" />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
        Something went wrong!
      </h2>
      
      <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
        We encountered an unexpected error while processing your request. Our team has been notified. Please try again.
      </p>

      <div className="flex gap-3">
        <Button 
          onClick={() => reset()}
          className="gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_8px_20px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 text-sm font-semibold"
        >
          Try Again
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/dashboard'}
          className="rounded-xl border-[rgba(148,163,184,0.2)] shadow-sm hover:shadow-md transition-all px-6 py-3"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}