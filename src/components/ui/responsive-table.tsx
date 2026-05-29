"use client"

import { useMediaQuery } from "@/hooks/use-media-query" // هننشئ ده في الخطوة الجاية

interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <div className={className}>
        {children}
      </div>
    )
  }

  // على الموبايل، هنعرض محتوى الجدول ككروت بدل Table
  return (
    <div className={className}>
      {/* هنقوم لاحقاً بتعديل الـ children عشان يتحول لكروت، 
          لكن ده الهيكل الأساسي اللي يمنع الـ Horizontal Scroll */}
      <div className="grid grid-cols-1 gap-4">
        {children}
      </div>
    </div>
  )
}