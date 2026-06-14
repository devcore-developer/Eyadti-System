// src/components/dashboard/chart-card.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, subtitle, children, className }: ChartCardProps) {
  return (
    // ✨ إضافة min-w-0 و w-full عشان نحل مشكلة اختفاء الشارت في الـ Grid
    <Card className={cn("premium-card min-w-0 w-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      {/* ✨ إضافة min-w-0 هنا كمان عشان الـ ResponsiveContainer يمسك الـ Width صح */}
      <CardContent className="pt-0 min-w-0">{children}</CardContent>
    </Card>
  )
}