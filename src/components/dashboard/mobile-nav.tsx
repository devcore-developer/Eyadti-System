"use client"

import * as React from "react" // ← ضبطنا الـ Import هنا
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "./sidebar"
import { cn } from "@/lib/utils" // ← أضفنا ده

interface Branch {
  id: string
  name: string
  code: string
}

export function MobileNav({ 
  branches, 
  selectedBranchId,
  clinicName
}: { 
  branches: Branch[]
  selectedBranchId: string | null
  clinicName: string
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // إغلاق الـ Drawer لما المستخدم يضغط على لينك
  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      {/* ── Hamburger Button ── */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="px-0 text-foreground hover:bg-transparent">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        
        {/* ── Sheet Drawer ── */}
        <SheetContent 
          side="left" 
          className={cn(
            "w-[280px] p-0 bg-white dark:bg-[#1B2838]",
            "border-r-0 shadow-[10px_0_40px_rgba(0,0,0,0.15)] dark:shadow-[10px_0_40px_rgba(0,0,0,0.4)]"
          )}
        >
          <div className="flex flex-col h-full">
            {/* ── Drawer Header ── */}
            <div className="flex h-14 items-center gap-2.5 px-6 border-b border-[rgba(148,163,184,0.12)] dark:border-[rgba(255,255,255,0.06)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_4px_12px_rgba(107,156,255,0.25)]">
                <Stethoscope className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight">Eyadti</span>
            </div>
            
            {/* ── Sidebar Content (Full Height) ── */}
            <div className="flex-1 overflow-y-auto">
              <Sidebar branches={branches} selectedBranchId={selectedBranchId} isMobile />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Clinic Name in the Middle ── */}
      <div className="flex-1 text-center">
        <h1 className="text-sm font-semibold text-foreground truncate">{clinicName}</h1>
      </div>
    </>
  )
}