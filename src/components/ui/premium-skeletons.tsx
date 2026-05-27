import { Skeleton } from "@/components/ui/skeleton"

export function CardSkeleton() {
  return (
    <div className="rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br from-white/95 to-[#F0F8FF]/95 dark:from-[#223247] dark:to-[#1D2A3B] p-6 shadow-[0_15px_35px_rgba(100,116,139,0.10)] space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-3/4 rounded-lg" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-1/3 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br from-white/95 to-[#F0F8FF]/95 dark:from-[#223247] dark:to-[#1D2A3B] p-6 shadow-[0_15px_35px_rgba(100,116,139,0.10)] space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      {/* Table Header */}
      <Skeleton className="h-12 w-full rounded-xl bg-muted/50" />
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 rtl:space-x-reverse">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5 rounded-lg" />
            <Skeleton className="h-3 w-2/5 rounded-md" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br from-white/95 to-[#F0F8FF]/95 dark:from-[#223247] dark:to-[#1D2A3B] p-6 shadow-[0_15px_35px_rgba(100,116,139,0.10)] space-y-4">
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
            className="flex-1 rounded-t-lg bg-gradient-to-t from-[#6B9CFF]/10 to-[#6B9CFF]/30 dark:from-[#6B9CFF]/5 dark:to-[#6B9CFF]/20" 
            style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-gradient-to-br from-white/95 to-[#F0F8FF]/95 dark:from-[#223247] dark:to-[#1D2A3B] p-6 shadow-[0_15px_35px_rgba(100,116,139,0.10)] space-y-6">
      <Skeleton className="h-8 w-1/3 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  )
}