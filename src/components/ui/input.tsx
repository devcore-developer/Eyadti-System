// components/ui/input.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[12px] border border-input bg-[rgba(255,255,255,0.9)] dark:bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-foreground shadow-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-[#6B9CFF] focus-visible:shadow-[0_0_0_4px_rgba(107,156,255,0.12)] hover:border-muted-foreground/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 backdrop-blur-sm",
          // Error state styling (when aria-invalid is passed)
          "aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:shadow-[0_0_0_4px_rgba(239,68,68,0.12)] aria-[invalid=true]:focus-visible:border-danger",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }