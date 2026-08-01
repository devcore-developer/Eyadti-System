import { LogOut } from "lucide-react"
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
import Link from "next/link"

interface Branch { id: string; name: string; code: string; }
interface UserData { name?: string | null; email?: string | null; role?: string | null; }

export function Sidebar({ 
  user, 
  branches, 
  selectedBranchId,
  isMobile = false 
}: { 
  user?: UserData;
  branches: Branch[];
  selectedBranchId: string | null;
  isMobile?: boolean;
}) {
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN"
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"

  return (
    <aside className={cn(
      "flex flex-col text-sidebar-foreground print:hidden bg-white dark:bg-[#1B2838]",
      isMobile 
        ? "w-full h-full shadow-none border-none" 
        : "w-[260px] shrink-0 h-full border-r border-gray-200/60 dark:border-white/[0.06]"
    )}>
      
      {!isMobile && (
        <div className="flex h-[72px] items-center justify-center px-6 border-b border-gray-200/60 dark:border-white/[0.06]">
          <Link href="/dashboard">
            <img 
              src="/dashboard-logo.png" 
              alt="Dashboard Logo" 
              className="h-10 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity" 
            />
          </Link>
        </div>
      )}

      {isAdmin && branches.length > 0 && (
        <div className="px-3 pt-4 pb-1">
          <BranchSwitcher branches={branches} selectedBranchId={selectedBranchId} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 px-2.5 py-2 overscroll-contain hide-scrollbar">
        <SidebarNav isAdmin={isAdmin} />
      </div>

      <div className="mt-auto border-t border-gray-200/60 dark:border-white/[0.06] p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 outline-none hover:bg-gray-50 dark:hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]">
            <div className="relative">
              <div className="rounded-full p-[1.5px] bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF]">
                <Avatar className="h-8 w-8 border-2 border-white dark:border-[#1B2838]">
                  <AvatarFallback className="bg-gray-50 dark:bg-[#223247] text-[10px] font-bold text-[#6B9CFF]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#1B2838]" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-white">
                {user?.name || "User"}
              </p>
              <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#6B9CFF]/[0.08] text-[#6B9CFF] rounded-md">
                {user?.role || "N/A"}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 mb-2 rounded-xl p-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] dark:bg-[#223247] border-gray-200/60 dark:border-white/[0.06]">
            <div className="flex items-center gap-3 px-2.5 py-2.5 mb-1">
              <Avatar className="h-9 w-9 border-2 border-white dark:border-[#223247]">
                <AvatarFallback className="bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF] text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-gray-100 dark:bg-white/[0.06]" />
            <form action="/api/auth/signout" method="POST">
              <input type="hidden" name="callbackUrl" value="/login" />
              <button type="submit" className="w-full">
                <DropdownMenuItem className="cursor-pointer text-red-500 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-lg font-medium mt-1">
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