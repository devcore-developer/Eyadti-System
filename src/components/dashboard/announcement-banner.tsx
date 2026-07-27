"use client"

import { useState, useEffect } from "react"
import { XCircle, Info, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getActiveAnnouncementsForClinic, dismissOrReadAnnouncement } from "@/lib/actions/clinic-announcements"

const typeConfig = {
  INFO: { icon: Info, bg: "bg-[#6B9CFF]/10", border: "border-[#6B9CFF]/30", text: "text-[#6B9CFF]", button: "bg-[#6B9CFF]/20 hover:bg-[#6B9CFF]/30 text-[#6B9CFF]" },
  WARNING: { icon: AlertTriangle, bg: "bg-[#F4B860]/10", border: "border-[#F4B860]/30", text: "text-[#F4B860]", button: "bg-[#F4B860]/20 hover:bg-[#F4B860]/30 text-[#F4B860]" },
  CRITICAL: { icon: XCircle, bg: "bg-[#EF6B6B]/10", border: "border-[#EF6B6B]/30", text: "text-[#EF6B6B]", button: "bg-[#EF6B6B]/20 hover:bg-[#EF6B6B]/30 text-[#EF6B6B]" }
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    getActiveAnnouncementsForClinic().then(setAnnouncements)
  }, [])

  const handleDismiss = async (id: string) => {
    await dismissOrReadAnnouncement(id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
    if (currentIndex >= announcements.length - 1) setCurrentIndex(0)
  }

  if (announcements.length === 0) return null

  const current = announcements[currentIndex]
  const config = typeConfig[current.type as keyof typeof typeConfig] || typeConfig.INFO
  const Icon = config.icon

  return (
    <div className={cn("w-full flex items-center justify-between gap-4 p-4 rounded-2xl border mb-6 animate-in fade-in slide-in-from-top-2", config.bg, config.border)}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className={cn("h-5 w-5 shrink-0", config.text)} />
        <div className="min-w-0">
          <p className={cn("text-sm font-bold truncate", config.text)}>{current.title}</p>
          <p className="text-xs text-muted-foreground truncate">{current.message}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        {announcements.length > 1 && (
          <button onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)} className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors", config.button)}>
            Next ({currentIndex + 1}/{announcements.length})
          </button>
        )}
        <button onClick={() => handleDismiss(current.id)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}