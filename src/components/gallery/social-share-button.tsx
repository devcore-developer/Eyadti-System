"use client"

import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface SocialShareButtonProps {
  beforeSrc: string
  afterSrc: string
  clinicLogo?: string | null
}

// دالة مساعدة لرسم الصورة بحيث تملأ مكانها بدون تشويه (Cover)
const drawImageCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  const imgRatio = img.width / img.height
  const rectRatio = w / h
  let sx = 0, sy = 0, sw = img.width, sh = img.height

  if (imgRatio > rectRatio) {
    sw = img.height * rectRatio
    sx = (img.width - sw) / 2
  } else {
    sh = img.width / rectRatio
    sy = (img.height - sh) / 2
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

export function SocialShareButton({ beforeSrc, afterSrc, clinicLogo }: SocialShareButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      // تحميل الصور كـ HTMLImageElement
      const loadImage = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = "anonymous" // مهم جداً عشان نتجنب مشاكل CORS من Cloudinary
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = src
        })

      const [beforeImg, afterImg, logoImg] = await Promise.all([
        loadImage(beforeSrc),
        loadImage(afterSrc),
        clinicLogo ? loadImage(clinicLogo) : Promise.resolve(null),
      ])

      // إعداد الـ Canvas (حجم مناسب لفيسبوك وإنستجرام 1200x630)
      const canvas = document.createElement("canvas")
      canvas.width = 1200
      canvas.height = 630
      const ctx = canvas.getContext("2d")!

      // 1. خلفية الديزاين
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 2. رسم صورة Before (النص اليسار)
      drawImageCover(ctx, beforeImg, 0, 0, 600, 630)

      // 3. رسم صورة After (النص اليمين)
      drawImageCover(ctx, afterImg, 600, 0, 600, 630)

      // 4. خط فاصل في النص
      ctx.strokeStyle = "#FFFFFF"
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(600, 0)
      ctx.lineTo(600, 630)
      ctx.stroke()

      // 5. علامة Before
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
      ctx.fillRect(20, 20, 120, 40)
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "bold 24px Arial"
      ctx.fillText("BEFORE", 32, 48)

      // 6. علامة After
      ctx.fillStyle = "rgba(91, 192, 190, 0.8)" // لون العيادة
      ctx.fillRect(1060, 20, 120, 40)
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "bold 24px Arial"
      ctx.fillText("AFTER", 1072, 48)

      // 7. اللوجو فقط (أسفل اليمين)
      if (logoImg) {
        // رسم دائرة بيضاء خلف اللوجو عشان يبان على أي خلفية
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.arc(1145, 580, 32, 0, Math.PI * 2); // centerX, centerY, radius
        ctx.fill();

        // رسم اللوجو نفسه داخل الدائرة
        ctx.drawImage(logoImg, 1115, 550, 60, 60)
      }

      // 8. تحويل الـ Canvas لرابط تحميل
      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `before-and-after-${Date.now()}.png`
      link.href = dataUrl
      link.click()

    } catch (error) {
      console.error("Failed to generate image", error)
      alert("Failed to generate image. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white dark:bg-[#223247] hover:bg-gray-100"
      onClick={handleDownload}
      disabled={isGenerating}
    >
      {isGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />} 
      Share
    </Button>
  )
}