"use client"

import * as React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function MobileNav({ 
  clinicName,
  children 
}: { 
  clinicName: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="px-0 h-10 w-10 text-foreground hover:bg-transparent active:bg-slate-100 dark:active:bg-slate-800 transition-colors">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        
        <SheetContent 
          side="left" 
          className={cn(
            "w-[85vw] max-w-[320px] p-0 bg-white dark:bg-[#1B2838]",
            "border-r-0 shadow-[10px_0_40px_rgba(0,0,0,0.15)] dark:shadow-[10px_0_40px_rgba(0,0,0,0.4)]",
            "data-[state=open]:animate-slide-in-from-left"
          )}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-full">
            <div className="flex items-center px-5 py-4 border-b border-[rgba(148,163,184,0.12)] dark:border-[rgba(255,255,255,0.06)]">
              <Link href="/dashboard" className="flex items-center gap-3">
                <img 
                  src="/dashboard-logo.png" 
                  alt="Nexora" 
                  className="h-[30px] w-[30px] object-contain"
                />
                <span 
                  className="text-[14px] font-bold tracking-[-0.02em] text-[#111827] dark:text-white"
                  style={{ fontFamily: "'Inter', 'Geist', 'Manrope', system-ui, sans-serif" }}
                >
                  Nexora
                </span>
              </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto overscroll-contain hide-scrollbar">
              {children}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}