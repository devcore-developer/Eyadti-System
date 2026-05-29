import { cn } from "@/lib/utils"

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div className={cn("flex flex-col gap-6 md:gap-8 animate-fade-in-up", className)}>
      {children}
    </div>
  )
}