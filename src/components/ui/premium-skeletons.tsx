// components/ui/premium-skeletons.tsx
import { Skeleton } from "@/components/ui/skeleton"

export function CardSkeleton() {
  return (
    <div className="premium-card p-6 space-y-5 animate-fade">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-3/4 rounded-lg" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-3 w-1/3 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="premium-card p-6 space-y-6 animate-fade">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
        <Skeleton className="h-10 w-full sm:w-32 rounded-xl" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl bg-muted/30" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 rtl:space-x-reverse py-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5 rounded-lg" />
            <Skeleton className="h-3 w-2/5 rounded-md" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
          <Skeleton className="h-8 w-24 rounded-xl hidden sm:block" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="premium-card p-6 space-y-6 animate-fade">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-32 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
      <div className="h-[300px] w-full flex items-end gap-2 pt-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t-lg bg-gradient-to-t from-[#6B9CFF]/10 to-[#6B9CFF]/20 dark:from-[#6B9CFF]/5 dark:to-[#6B9CFF]/10" 
            style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="premium-card p-6 space-y-8 animate-fade">
      <Skeleton className="h-8 w-1/3 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  )
}