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

// 🚀 Super Admin Navigation (Platform Level)
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
    <nav className="flex-1 space-y-1 overflow-y-auto py-2 md:py-4">
      {navigation.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "sidebar-item group flex items-center gap-3 text-[0.8125rem] font-medium transition-colors duration-150",
              active
                ? "active"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors duration-150",
                active
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
              )}
            />
            <span className="truncate">{item.name}</span>
          </Link>
        )
      })}

      {isAdmin && (
        <>
          <Separator className="my-3 bg-sidebar-border" />
          <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/30">
            Clinic Administration
          </p>
          <div className="space-y-1">
            {adminNavigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "sidebar-item group flex items-center gap-3 text-[0.8125rem] font-medium transition-colors duration-150",
                    active
                      ? "active"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors duration-150",
                      active
                        ? "text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* ─── SUPER ADMIN SECTION ─── */}
      {isSuperAdmin && (
        <>
          <Separator className="my-3 bg-sidebar-border" />
          <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-primary/80">
            Platform Control
          </p>
          <div className="space-y-1">
            {superAdminNavigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "sidebar-item group flex items-center gap-3 text-[0.8125rem] font-medium transition-colors duration-150",
                    active
                      ? "active text-primary bg-primary/10"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/20 hover:text-primary"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors duration-150",
                      active ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-primary/70"
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