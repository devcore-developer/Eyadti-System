"use client"

import React, { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toPng } from "html-to-image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Loader2, Sparkles, LayoutGrid, Rows3, Diamond, Palette, Type, ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types & Configs ──────────────────────────────────
type TemplateType = "side-by-side" | "top-bottom" | "slanted"
type ThemeType = "clean-white" | "dark-luxury" | "dental-mint" | "aesthetic-gold"
type FormatType = "instagram-post" | "instagram-story" | "landscape"

const themes = {
  "clean-white": { bg: "#FFFFFF", text: "#0F172A", accent: "#6B9CFF", labelBg: "rgba(0,0,0,0.7)", labelText: "#FFFFFF" },
  "dark-luxury": { bg: "#17212F", text: "#F8FAFC", accent: "#5BC0BE", labelBg: "rgba(255,255,255,0.1)", labelText: "#F8FAFC" },
  "dental-mint": { bg: "#F0FDF4", text: "#14532D", accent: "#5BC0BE", labelBg: "rgba(91,192,190,0.2)", labelText: "#14532D" },
  "aesthetic-gold": { bg: "#FFFBEB", text: "#78350F", accent: "#D97706", labelBg: "rgba(217,119,6,0.2)", labelText: "#78350F" },
}

const formats = {
  "instagram-post": { width: 1080, height: 1080, ratio: "aspect-square" },
  "instagram-story": { width: 1080, height: 1920, ratio: "aspect-[9/16]" },
  "landscape": { width: 1200, height: 630, ratio: "aspect-video" },
}

interface NexoraEditorProps {
  isOpen: boolean
  onClose: () => void
  beforeSrc: string
  afterSrc: string
  clinicName?: string
  clinicLogo?: string | null
}

export function NexoraEditor({ isOpen, onClose, beforeSrc, afterSrc, clinicName = "Nexora Clinic", clinicLogo }: NexoraEditorProps) {
  const exportRef = useRef<HTMLDivElement>(null)
  const [template, setTemplate] = useState<TemplateType>("side-by-side")
  const [theme, setTheme] = useState<ThemeType>("clean-white")
  const [format, setFormat] = useState<FormatType>("instagram-post")
  const [isExporting, setIsExporting] = useState(false)
  const [customTitle, setCustomTitle] = useState("Before & After")
  const [watermark, setWatermark] = useState(true)
  
  const currentTheme = themes[theme]
  const currentFormat = formats[format]

  const handleExport = useCallback(async () => {
    if (!exportRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await toPng(exportRef.current, { 
        quality: 1.0, 
        pixelRatio: 2, // لدقة عالية جداً (Retina)
        cacheBust: true,
      })
      const link = document.createElement("a")
      link.download = `nexora-${template}-${format}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setIsExporting(false)
    }
  }, [template, format])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-[#6B9CFF]" />
            Nexora Premium Exporter
          </DialogTitle>
          <DialogDescription>Create Instagram-ready branded medical showcases.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* ── Left: Controls ── */}
          <div className="w-full md:w-80 border-r p-6 space-y-6 overflow-y-auto bg-slate-50/50 dark:bg-[#17212F]/50">
            
            {/* Template Picker */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><LayoutGrid className="h-3.5 w-3.5"/> Template</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { id: "side-by-side", icon: Rows3, label: "Side by Side" },
                  { id: "top-bottom", icon: Rows3, label: "Top/Bottom", rotate: true },
                  { id: "slanted", icon: Diamond, label: "Slanted Lux" },
                ].map((t) => (
                  <button key={t.id} onClick={() => setTemplate(t.id as TemplateType)} className={cn("p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all text-xs", template === t.id ? "border-[#6B9CFF] bg-[#6B9CFF]/10 text-[#6B9CFF]" : "border-border hover:border-muted-foreground/30")}>
                    <t.icon className={cn("h-5 w-5", t.rotate && "rotate-90")} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Picker */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Palette className="h-3.5 w-3.5"/> Theme</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {Object.entries(themes).map(([key, value]) => (
                  <button key={key} onClick={() => setTheme(key as ThemeType)} className={cn("w-8 h-8 rounded-full border-2 transition-transform hover:scale-110", theme === key ? "border-[#6B9CFF] scale-110 ring-2 ring-offset-2 ring-[#6B9CFF]" : "border-gray-300")} style={{ backgroundColor: value.bg }} title={key} />
                ))}
              </div>
            </div>

            {/* Format Picker */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><ImagePlus className="h-3.5 w-3.5"/> Format</label>
              <div className="flex gap-2 mt-2">
                {Object.keys(formats).map((key) => (
                  <button key={key} onClick={() => setFormat(key as FormatType)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all", format === key ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
                    {key.split("-").join(" ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Branding Details */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Type className="h-3.5 w-3.5"/> Branding</label>
              <Input placeholder="Title (e.g., Before & After)" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="watermark" checked={watermark} onChange={(e) => setWatermark(e.target.checked)} className="rounded" />
                <label htmlFor="watermark" className="text-xs text-muted-foreground">Subtle Watermark</label>
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white" onClick={handleExport} disabled={isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Export High-Res PNG
            </Button>
          </div>

          {/* ── Right: Live Preview ── */}
          <div className="flex-1 p-8 flex items-center justify-center bg-slate-200/50 dark:bg-[#0F172A] overflow-auto">
            <div className="relative shadow-2xl transition-all duration-500" style={{ maxWidth: "400px", width: "100%" }}>
              {/* The Actual Rendered Canvas (Hidden scaling logic) */}
              <div className={cn("relative overflow-hidden mx-auto shadow-xl", currentFormat.ratio)} style={{ backgroundColor: currentTheme.bg }}>
                <div ref={exportRef} className="absolute inset-0 flex flex-col" style={{ width: `${currentFormat.width}px`, height: `${currentFormat.height}px`, transform: `scale(${1})`, transformOrigin: "top left" }}>
                  
                  {/* Header */}
                  <div className="p-8 flex items-center justify-between" style={{ color: currentTheme.text }}>
                    <div>
                      <h2 className="text-4xl font-bold tracking-tight">{customTitle}</h2>
                      <p className="text-lg opacity-70 mt-1">{clinicName}</p>
                    </div>
                    {clinicLogo && <img src={clinicLogo} crossOrigin="anonymous" className="h-16 w-16 rounded-full object-cover border-2" style={{ borderColor: currentTheme.accent }} />}
                  </div>

                  {/* Images Area */}
                  <div className={cn("flex-1 p-8 pt-0", template === "top-bottom" ? "flex flex-col gap-6" : "flex gap-6")}>
                    {/* Before Image Wrapper */}
                    <div className={cn("relative flex-1 overflow-hidden rounded-2xl shadow-lg", template === "slanted" && "rounded-r-none")}>
                      <img src={beforeSrc} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <span className="absolute bottom-4 left-4 px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-md" style={{ backgroundColor: currentTheme.labelBg, color: currentTheme.labelText }}>BEFORE</span>
                    </div>

                    {/* After Image Wrapper */}
                    <div className={cn("relative flex-1 overflow-hidden rounded-2xl shadow-lg", template === "slanted" && "rounded-l-none clip-slant-after")}>
                      <div className="absolute inset-0 ring-2 ring-inset" style={{ borderColor: currentTheme.accent, boxShadow: `0 0 20px ${currentTheme.accent}40` }} />
                      <img src={afterSrc} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <span className="absolute bottom-4 right-4 px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-md" style={{ backgroundColor: currentTheme.accent, color: currentTheme.labelText }}>AFTER</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-8 pt-4 flex justify-between items-center opacity-60" style={{ color: currentTheme.text }}>
                    <span className="text-sm">www.nexora.com</span>
                    {watermark && <span className="text-xs font-bold tracking-widest" style={{ color: currentTheme.accent }}>NEXORA</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}