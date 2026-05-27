import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  href?: string
  className?: string
  gradient?: string 
  iconClassName?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  href,
  className,
  gradient = "from-[#5BC0BE] to-[#6B9CFF]", // Premium Default Gradient
  iconClassName,
}: StatCardProps) {
  const content = (
    <CardContent className="p-6 relative z-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-white/80 drop-shadow-sm">
            {title}
          </p>
          <p className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm font-medium text-white/70 mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 pt-1">
              <span className="text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner border border-white/20",
            iconClassName
          )}
        >
          <Icon className="h-7 w-7 text-white drop-shadow-sm" />
        </div>
      </div>
    </CardContent>
  )

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-0 shadow-[0_15px_35px_rgba(100,116,139,0.15)] transition-all duration-200",
        `bg-gradient-to-br ${gradient}`,
        href
          ? "cursor-pointer hover:shadow-[0_20px_45px_rgba(107,156,255,0.25)] hover:-translate-y-[3px] hover:scale-[1.01]"
          : "hover:shadow-[0_20px_45px_rgba(100,116,139,0.20)] hover:-translate-y-[2px]",
        className
      )}
    >
      {/* Premium Decorative Shapes */}
      <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-black/5 blur-xl pointer-events-none" />

      {href ? (
        <Link href={href} className="block h-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </Card>
  )
}