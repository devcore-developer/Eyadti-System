"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { exitSupportMode } from "@/lib/actions/super-admin"
import { ShieldAlert, XCircle, Clock } from "lucide-react"
import { useEffect, useState } from "react"

export function SupportModeBanner({ clinicId }: { clinicId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [elapsedTime, setElapsedTime] = useState(0)

  // ✅ مؤقت زمن بيقيس الثواني
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleExit = () => {
    startTransition(async () => {
      await exitSupportMode()
      router.push('/super-admin')
      router.refresh()
    })
  }

  // ✅ تحويل الثواني لشكل ساعات ودقائق
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-rose-600 to-rose-500 text-white px-4 py-2.5 flex items-center justify-center gap-4 text-sm font-medium shadow-lg">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline">
        Viewing <span className="font-bold underline mx-1">Support Mode</span> All actions are being recorded.
      </span>
      
      {/* ✅ مؤقت الوقت */}
      <div className="hidden sm:flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-md text-xs font-mono">
        <Clock className="h-3.5 w-3.5" />
        {formatTime(elapsedTime)}
      </div>
      
      <span className="sm:hidden">Support Mode ({formatTime(elapsedTime)})</span>

      <button 
        onClick={handleExit} 
        disabled={isPending}
        className="bg-white/20 hover:bg-white/30 disabled:opacity-50 px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors text-xs font-bold uppercase tracking-wide"
      >
        <XCircle className="h-3.5 w-3.5" />
        {isPending ? "Exiting..." : "Exit"}
      </button>
    </div>
  )
}