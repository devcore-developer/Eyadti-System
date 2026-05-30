"use client"

import { signOut } from "next-auth/react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup // <-- تمت إضافة هذا
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Settings, Building2, HelpCircle } from "lucide-react"
import Link from "next/link"

interface UserProfileMenuProps {
  userName: string
  userEmail: string
  userRole: string
  clinicName: string
  branchName?: string | null
}

export function UserProfileMenu({ 
  userName, userEmail, userRole, clinicName, branchName 
}: UserProfileMenuProps) {
  const initials = userName?.split(" ").map(n => n[0]).join("").substring(0, 2) || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative h-9 w-9 rounded-full shadow-sm hover:shadow-md transition-all outline-none flex items-center justify-center">
        <Avatar className="h-9 w-9 border-2 border-white dark:border-[#1A2332] shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF] text-white text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-72 p-2 border-[rgba(148,163,184,0.15)] dark:border-[rgba(255,255,255,0.08)] shadow-[0_20px_40px_rgba(0,0,0,0.15)] rounded-2xl bg-white dark:bg-[#1A2332]" align="end">
        
        {/* تمت إضافة DropdownMenuGroup هنا */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal p-3">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-bold leading-none text-foreground">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              
              <div className="flex items-center gap-2 pt-2 mt-2 border-t border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)]">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F5F8FF] dark:bg-[#223247] text-[#6B9CFF]">
                  {userRole}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {clinicName} {branchName ? `• ${branchName}` : ''}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="bg-[rgba(148,163,184,0.1)] dark:bg-[rgba(255,255,255,0.06)]" />
        
        <Link href="/settings">
          <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5 my-1 focus:bg-[#F5F8FF] dark:focus:bg-[#223247]">
            <Settings className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-sm font-medium">Account Settings</span>
          </DropdownMenuItem>
        </Link>
        
        <Link href="/settings/clinics">
          <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5 my-1 focus:bg-[#F5F8FF] dark:focus:bg-[#223247]">
            <Building2 className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-sm font-medium">Clinic Settings</span>
          </DropdownMenuItem>
        </Link>
        
        <Link href="/settings/help" legacyBehavior passHref>
          <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5 my-1 focus:bg-[#F5F8FF] dark:focus:bg-[#223247]">
            <HelpCircle className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-sm font-medium">Help & Support</span>
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator className="bg-[rgba(148,163,184,0.1)] dark:bg-[rgba(255,255,255,0.06)]" />
        
        <DropdownMenuItem 
          className="rounded-xl cursor-pointer py-2.5 my-1 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="text-sm font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}