import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-[14px] border border-input bg-[rgba(255,255,255,0.9)] dark:bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-[#6B9CFF] focus-visible:shadow-[0_0_0_4px_rgba(107,156,255,0.12)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 backdrop-blur-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }