import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LogOut, Stethoscope } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarNav } from "./sidebar-nav"
import { BranchSwitcher } from "@/components/branch/branch-switcher"
import { cn } from "@/lib/utils"

interface Branch {
  id: string;
  name: string;
  code: string;
}

export async function Sidebar({ 
  branches, 
  selectedBranchId,
  isMobile = false 
}: { 
  branches: Branch[];
  selectedBranchId: string | null;
  isMobile?: boolean;
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isAdmin = session.user.role === "ADMIN"
  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <aside className={cn(
      "flex flex-col text-sidebar-foreground print:hidden bg-gradient-to-b from-white to-[#F7FBFF] dark:from-[#1B2838] dark:to-[#1B2838]",
      isMobile 
        ? "w-full h-full shadow-none border-none" 
        : "w-[260px] shrink-0 h-full shadow-[8px_0_30px_rgba(15,23,42,0.08)] dark:shadow-[8px_0_30px_rgba(0,0,0,0.2)] border-r border-[rgba(148,163,184,0.12)] dark:border-[rgba(255,255,255,0.06)]"
    )}>
      
      {/* ── Logo (Desktop Only) ── */}
      {!isMobile && (
        <div className="flex h-16 items-center gap-2.5 px-6 border-b border-[rgba(148,163,184,0.12)] dark:border-[rgba(255,255,255,0.06)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_4px_12px_rgba(107,156,255,0.25)]">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold tracking-tight text-slate-800 dark:text-white">Eyadti</span>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] bg-clip-text text-transparent">
              PRO
            </span>
          </div>
        </div>
      )}

      {/* ── Branch Switcher ── */}
      {isAdmin && branches.length > 0 && (
        <div className={cn("pb-2 px-4", isMobile ? "pt-2" : "pt-4")}>
          <BranchSwitcher branches={branches} selectedBranchId={selectedBranchId} />
        </div>
      )}

      {/* ── Navigation (min-h-0 عشان الـ Scroll يشتغل صح جوه الـ Drawer) ── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2">
        <SidebarNav isAdmin={isAdmin} />
      </div>

      {/* ── Premium User Footer ── */}
      <div className="mt-auto border-t border-[rgba(148,163,184,0.12)] dark:border-[rgba(255,255,255,0.06)] p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 transition-all outline-none hover:bg-[rgba(107,156,255,0.06)] dark:hover:bg-[rgba(107,156,255,0.08)] focus-visible:ring-2 focus-visible:ring-ring">
            <div className="relative">
              <div className="rounded-full p-[2px] bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF]">
                <Avatar className="h-9 w-9 border-2 border-white dark:border-[#1B2838]">
                  <AvatarFallback className="bg-slate-100 dark:bg-[#223247] text-[11px] font-bold text-[#6B9CFF]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#1B2838]"></span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                {session.user.name}
              </p>
              <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[rgba(107,156,255,0.1)] text-[#6B9CFF] rounded-md">
                {session.user.role}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 mb-2 rounded-2xl p-2 shadow-[0_15px_35px_rgba(0,0,0,0.15)] dark:bg-[#223247] border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-3 px-2 py-2 mb-1">
              <Avatar className="h-9 w-9 border-2 border-white dark:border-[#223247] shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF] text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5 min-w-0">
                <p className="text-sm font-semibold truncate">{session.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-[rgba(148,163,184,0.1)] dark:bg-[rgba(255,255,255,0.06)]" />
            <form action="/api/auth/signout" method="POST">
              <input type="hidden" name="callbackUrl" value="/login" />
              <button type="submit" className="w-full">
                <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-xl font-medium mt-1">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}