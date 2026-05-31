"use client"

import { useState, useRef, MouseEvent, TouchEvent } from "react"
import { cn } from "@/lib/utils"

interface BeforeAfterSliderProps {
  beforeSrc: string
  afterSrc: string
  className?: string
}

export function BeforeAfterSlider({ beforeSrc, afterSrc, className }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }

  const handleMouseDown = () => setIsDragging(true)
  const handleMouseUp = () => setIsDragging(false)
  const handleMouseMove = (e: MouseEvent) => isDragging && handleMove(e.clientX)
  const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX)

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-72 md:h-96 rounded-2xl overflow-hidden cursor-col-resize select-none shadow-lg", className)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onTouchMove={handleTouchMove}
    >
      {/* After Image (Background) */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${afterSrc})` }}
      />

      {/* Before Image (Foreground with clip) */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${beforeSrc})`,
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
        }}
      />

      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white/80 shadow-xl"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-primary font-bold text-xs border-2 border-primary">
          ↔
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
        Before
      </span>
      <span className="absolute top-4 right-4 bg-primary/80 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
        After
      </span>
    </div>
  )
}