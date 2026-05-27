"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, defaultChecked, onCheckedChange, name, disabled, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked ?? checked ?? false)

    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked)
      }
    }, [checked])

    const handleToggle = () => {
      if (disabled) return
      const newState = !isChecked
      setIsChecked(newState)
      onCheckedChange?.(newState)
    }

    return (
      <div className="inline-flex items-center gap-2">
        <input type="hidden" name={name} value={isChecked ? "on" : "off"} />
        
        <button
          type="button"
          role="switch"
          aria-checked={isChecked}
          ref={ref}
          disabled={disabled}
          onClick={handleToggle}
          className={cn(
            "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // استخدام الـ Design Tokens بدل الألوان الصلبة
            isChecked ? "bg-primary" : "bg-input",
            className
          )}
          {...props}
        >
          <span
            className={cn(
              "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
              isChecked ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }