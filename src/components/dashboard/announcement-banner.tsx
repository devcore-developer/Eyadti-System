"use client"

import { useState, useEffect } from "react"
import { XCircle, Info, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getActiveAnnouncementsForClinic, dismissOrReadAnnouncement } from "@/lib/actions/clinic-announcements"

const typeConfig = {
  INFO: { icon: Info, bg: "bg-[#6B9CFF]/[0.06]", border: "border-[#6B9CFF]/20", text: "text-[#6B9CFF]", button: "bg-[#6B9CFF]/[0.1] hover:bg-[#6B9CFF]/[0.15] text-[#6B9CFF]" },
  WARNING: { icon: AlertTriangle, bg: "bg-[#F4B860]/[0.06]", border: "border-[#F4B860]/20", text: "text-[#F4B860]", button: "bg-[#F4B860]/[0.1] hover:bg-[#F4B860]/[0.15] text-[#F4B860]" },
  CRITICAL: { icon: XCircle, bg: "bg-[#EF6B6B]/[0.06]", border: "border-[#EF6B6B]/20", text: "text-[#EF6B6B]", button: "bg-[#EF6B6B]/[0.1] hover:bg-[#EF6B6B]/[0.15] text-[#EF6B6B]" }
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
    <div className={cn(
      "w-full flex items-center justify-between gap-4 px-4 py-3 rounded-xl border animate-in fade-in slide-in-from-top-1 duration-300",
      config.bg, config.border
    )}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className={cn("h-4 w-4 shrink-0", config.text)} />
        <div className="min-w-0">
          <p className={cn("text-[13px] font-semibold truncate", config.text)}>{current.title}</p>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{current.message}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 shrink-0">
        {announcements.length > 1 && (
          <button onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)} className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors", config.button)}>
            {currentIndex + 1}/{announcements.length}
          </button>
        )}
        <button onClick={() => handleDismiss(current.id)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}