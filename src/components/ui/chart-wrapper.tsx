"use client"

import { useState, useEffect, useRef } from "react"
import { ResponsiveContainer } from "recharts"

interface ChartWrapperProps {
  children: React.ReactNode
  height?: number | string
  className?: string
}

export function ChartWrapper({ children, height = 300, className }: ChartWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect
        // ✨ التأكد من أن الأبعاد أكبر من 0 لمنع خطأ الـ Recharts
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
        }
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  return (
    // ✨ إضافة min-w-0 لمنع تمدد الـ Chart خارج الـ Container
    <div ref={containerRef} className={`w-full min-w-0 ${className || ''}`} style={{ minHeight: height }}>
      {dimensions.width > 0 && dimensions.height > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm animate-pulse">
          Loading chart...
        </div>
      )}
    </div>
  )
}