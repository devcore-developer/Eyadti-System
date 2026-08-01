"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Receipt,
  Settings,
  Shield,
  Monitor,
  Globe,
  CreditCard,
  FileText,
  Building2,
  UserPlus,
  BarChart3,
  Activity,
  Zap,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "New Visit", href: "/reception/new", icon: UserPlus },
  { name: "Appointments", href: "/appointments", icon: CalendarDays },
  { name: "Waiting Room", href: "/waiting-room", icon: Monitor },
  { name: "Online Bookings", href: "/appointments/online", icon: Globe },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Invoices", href: "/invoices", icon: Receipt },
]

const adminNavigation = [
  { name: "Users & Roles", href: "/admin/users", icon: Shield },
  { name: "Clinic Settings", href: "/settings/clinics", icon: Settings },
  { name: "Public Booking", href: "/book", icon: Globe },
  { name: "Billing & Plan", href: "/settings/billing", icon: CreditCard },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
  { name: "Branches", href: "/settings/branches", icon: Building2 },
]

const superAdminNavigation = [
  { name: "Platform Overview", href: "/super-admin", icon: BarChart3 },
  { name: "All Clinics", href: "/super-admin/clinics", icon: Building2 },
  { name: "Platform Billing", href: "/super-admin/billing", icon: CreditCard },
  { name: "System Health", href: "/super-admin/system-health", icon: Activity },
  { name: "Feature Flags", href: "/super-admin/features", icon: Zap },
]

export function SidebarNav({ isAdmin, isSuperAdmin }: { isAdmin: boolean; isSuperAdmin?: boolean }) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto py-2">
      {navigation.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "sidebar-item group flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-150",
              active
                ? "active"
                : "text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-slate-800 dark:hover:text-white"
            )}
          >
            <item.icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
                active
                  ? "text-sidebar-accent-foreground"
                  : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              )}
            />
            <span className="truncate">{item.name}</span>
          </Link>
        )
      })}

      {isAdmin && (
        <>
          <Separator className="my-3 bg-gray-100 dark:bg-white/[0.06]" />
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Administration
          </p>
          <div className="space-y-0.5">
            {adminNavigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "sidebar-item group flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-150",
                    active
                      ? "active"
                      : "text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-slate-800 dark:hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
                      active
                        ? "text-sidebar-accent-foreground"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {isSuperAdmin && (
        <>
          <Separator className="my-3 bg-gray-100 dark:bg-white/[0.06]" />
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-primary/70">
            Platform
          </p>
          <div className="space-y-0.5">
            {superAdminNavigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "sidebar-item group flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-150",
                    active
                      ? "active text-primary bg-primary/[0.08]"
                      : "text-slate-500 dark:text-slate-400 hover:bg-primary/[0.04] hover:text-primary"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
                      active ? "text-primary" : "text-slate-400 dark:text-slate-500 group-hover:text-primary/70"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </nav>
  )
}