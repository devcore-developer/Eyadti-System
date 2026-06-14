"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NexoraEditor } from "@/components/gallery/nexora-editor"

interface SocialShareButtonProps {
  beforeSrcs: string[]
  afterSrcs: string[]
  clinicLogo?: string | null
  clinicName?: string
}

export function SocialShareButton({ beforeSrcs, afterSrcs, clinicLogo, clinicName = "Nexora Clinic" }: SocialShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedBefore, setSelectedBefore] = useState(beforeSrcs[0])
  const [selectedAfter, setSelectedAfter] = useState(afterSrcs[0])
  const pickerRef = useRef<HTMLDivElement>(null)

  // إخفاء الـ Picker لما تضغط خارجه
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleOpen = () => {
    // لو فيه صورة واحدة بس، افتح الـ Editor على طول
    if (beforeSrcs.length === 1 && afterSrcs.length === 1) {
      setIsOpen(true)
    } else {
      // لو فيه أكتر من صورة، اعرض القائمة للاختيار الأول
      setShowPicker(true)
    }
  }

  return (
    <div className="absolute top-2 left-2 z-10" ref={pickerRef}>
      <Button 
        variant="outline" 
        size="sm" 
        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-[#223247]/90 hover:bg-white dark:hover:bg-[#223247] backdrop-blur-sm gap-1.5 border-[#6B9CFF]/30 text-[#6B9CFF] shadow-sm"
        onClick={handleOpen}
      >
        <Sparkles className="h-3.5 w-3.5" /> 
        Premium Export
      </Button>

      {/* قائمة اختيار الصور لو فيه أكتر من صورة Before/After */}
      {showPicker && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#223247] border dark:border-white/10 rounded-2xl shadow-xl p-4 z-50 space-y-4 animate-scale-in">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Choose Before Image:</p>
            <div className="flex flex-wrap gap-2">
              {beforeSrcs.map((src, i) => (
                <div 
                  key={`b${i}`} 
                  onClick={() => setSelectedBefore(src)} 
                  className={`cursor-pointer h-14 w-14 rounded-lg overflow-hidden border-2 transition-all hover:opacity-100 ${selectedBefore === src ? 'border-[#5BC0BE] scale-105 opacity-100' : 'border-transparent opacity-60'}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Choose After Image:</p>
            <div className="flex flex-wrap gap-2">
              {afterSrcs.map((src, i) => (
                <div 
                  key={`a${i}`} 
                  onClick={() => setSelectedAfter(src)} 
                  className={`cursor-pointer h-14 w-14 rounded-lg overflow-hidden border-2 transition-all hover:opacity-100 ${selectedAfter === src ? 'border-[#6B9CFF] scale-105 opacity-100' : 'border-transparent opacity-60'}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                </div>
              ))}
            </div>
          </div>

          <Button 
            size="sm" 
            className="w-full bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-md hover:shadow-lg transition-all" 
            onClick={() => { setIsOpen(true); setShowPicker(false); }}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Open Designer
          </Button>
        </div>
      )}

      {/* الـ Nexora Premium Editor Dialog */}
      <NexoraEditor 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        beforeSrc={selectedBefore}
        afterSrc={selectedAfter}
        clinicName={clinicName}
        clinicLogo={clinicLogo}
      />
    </div>
  )
}