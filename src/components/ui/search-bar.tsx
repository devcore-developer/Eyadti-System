import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export function SearchBar({ className, ...props }: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="search"
        placeholder="Search..."
        className="w-full h-10 pl-10 pr-4 rounded-[var(--radius-input)] bg-muted/50 border border-transparent text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
        {...props}
      />
    </div>
  )
}