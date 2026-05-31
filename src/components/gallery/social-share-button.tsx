"use client"

import { Download, Loader2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"

interface SocialShareButtonProps {
  beforeSrcs: string[]
  afterSrcs: string[]
  clinicLogo?: string | null
}

const drawImageCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
  const imgRatio = img.width / img.height
  const rectRatio = w / h
  let sx = 0, sy = 0, sw = img.width, sh = img.height
  if (imgRatio > rectRatio) { sw = img.height * rectRatio; sx = (img.width - sw) / 2 } 
  else { sh = img.width / rectRatio; sy = (img.height - sh) / 2 }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

export function SocialShareButton({ beforeSrcs, afterSrcs, clinicLogo }: SocialShareButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
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

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const loadImage = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = src
        })

      const [beforeImg, afterImg, logoImg] = await Promise.all([
        loadImage(selectedBefore),
        loadImage(selectedAfter),
        clinicLogo ? loadImage(clinicLogo) : Promise.resolve(null),
      ])

      const canvas = document.createElement("canvas")
      canvas.width = 1200
      canvas.height = 630
      const ctx = canvas.getContext("2d")!

      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      drawImageCover(ctx, beforeImg, 0, 0, 600, 630)
      drawImageCover(ctx, afterImg, 600, 0, 600, 630)

      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(600, 0); ctx.lineTo(600, 630); ctx.stroke()

      ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; ctx.fillRect(20, 20, 120, 40)
      ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 24px Arial"; ctx.fillText("BEFORE", 32, 48)

      ctx.fillStyle = "rgba(91, 192, 190, 0.8)"; ctx.fillRect(1060, 20, 120, 40)
      ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 24px Arial"; ctx.fillText("AFTER", 1072, 48)

      if (logoImg) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)"; ctx.beginPath(); ctx.arc(1145, 580, 32, 0, Math.PI * 2); ctx.fill()
        ctx.drawImage(logoImg, 1115, 550, 60, 60)
      }

      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `before-and-after-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      setShowPicker(false) // إغلاق القائمة بعد التحميل
    } catch (error) {
      console.error("Failed to generate image", error)
      alert("Failed to generate image.")
    } finally {
      setIsGenerating(false)
    }
  }

  // لو فيه صورة واحدة بس للقبل والبعد، نزل على طول زي زمان
  const handleDirectDownload = () => {
    if (beforeSrcs.length === 1 && afterSrcs.length === 1) {
      setIsGenerating(true)
      handleDownload()
    } else {
      setShowPicker(true)
    }
  }

  return (
    <div className="absolute top-2 left-2 z-10" ref={pickerRef}>
      <Button 
        variant="outline" 
        size="sm" 
        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-[#223247] hover:bg-gray-100"
        onClick={handleDirectDownload}
        disabled={isGenerating}
      >
        {isGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />} 
        Share
      </Button>

      {/* قائمة اختيار الصور */}
      {showPicker && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#223247] border rounded-xl shadow-xl p-3 z-50 space-y-3">
          <div>
            <p className="text-xs font-semibold mb-2 text-foreground">Choose Before Image:</p>
            <div className="flex flex-wrap gap-2">
              {beforeSrcs.map((src, i) => (
                <div key={`b${i}`} onClick={() => setSelectedBefore(src)} className={`cursor-pointer h-14 w-14 rounded-md overflow-hidden border-2 transition-all ${selectedBefore === src ? 'border-[#5BC0BE] scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-xs font-semibold mb-2 text-foreground">Choose After Image:</p>
            <div className="flex flex-wrap gap-2">
              {afterSrcs.map((src, i) => (
                <div key={`a${i}`} onClick={() => setSelectedAfter(src)} className={`cursor-pointer h-14 w-14 rounded-md overflow-hidden border-2 transition-all ${selectedAfter === src ? 'border-[#6B9CFF] scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                </div>
              ))}
            </div>
          </div>

          <Button size="sm" className="w-full bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white" onClick={handleDownload} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
            Download Design
          </Button>
        </div>
      )}
    </div>
  )
}