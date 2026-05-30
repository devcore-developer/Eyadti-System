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
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Appointments", href: "/appointments", icon: CalendarDays },
  { name: "Online Bookings", href: "/appointments/online", icon: Monitor },
  { name: "Invoices", href: "/invoices", icon: Receipt },
]

const adminNavigation = [
  { name: "Users & Roles", href: "/admin/users", icon: Shield },
  { name: "Clinic Settings", href: "/settings/clinics", icon: Settings },
  // ← شيلنا الـ Gallery من هنا
  { name: "Public Booking", href: "/book", icon: Globe },
  { name: "Billing & Plan", href: "/settings/billing", icon: CreditCard },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
  { name: "Branches", href: "/settings/branches", icon: Building2 },
]

export function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      {navigation.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-1.5 text-[0.8125rem] font-medium transition-colors duration-150",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4 transition-colors duration-150",
                active
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
              )}
            />
            {item.name}
          </Link>
        )
      })}

      {isAdmin && (
        <>
          <Separator className="my-4 bg-sidebar-border" />
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/30">
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
                    "group flex items-center gap-3 rounded-md px-3 py-1.5 text-[0.8125rem] font-medium transition-colors duration-150",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-colors duration-150",
                      active
                        ? "text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </>
      )}
    </nav>
  )
}