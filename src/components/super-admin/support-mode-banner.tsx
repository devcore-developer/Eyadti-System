"use client"

import { useTransition } from "react" // ✅ التصحيح هنا
import { useRouter } from "next/navigation"
import { exitSupportMode } from "@/lib/actions/super-admin"
import { ShieldAlert, XCircle } from "lucide-react"

export function SupportModeBanner({ clinicId }: { clinicId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleExit = () => {
    startTransition(async () => {
      await exitSupportMode()
      router.push('/super-admin')
      router.refresh()
    })
  }

  return (
    <div className="bg-gradient-to-r from-rose-600 to-rose-500 text-white px-4 py-2.5 flex items-center justify-center gap-4 text-sm font-medium z-50 relative shadow-lg">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline">
        You are viewing this clinic in <span className="font-bold underline">Support Mode</span>. All actions are being recorded.
      </span>
      <span className="sm:hidden">
        Support Mode Active
      </span>
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