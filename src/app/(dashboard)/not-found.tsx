import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center animate-fade">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#EEF3FF] to-[#EAFBF9] dark:from-[#223247] dark:to-[#1D2A3B] text-[#6B9CFF] dark:text-[#89D6D2] mb-8 shadow-[0_15px_35px_rgba(107,156,255,0.15)]">
        <SearchX className="h-12 w-12" />
      </div>
      
      <h2 className="text-4xl font-extrabold text-foreground mb-3 tracking-tighter">
        404
      </h2>
      
      <h3 className="text-xl font-bold text-foreground mb-2">
        Page Not Found
      </h3>
      
      <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      <Link href="/dashboard">
        <Button className="gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_8px_20px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 text-sm font-semibold">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  )
}