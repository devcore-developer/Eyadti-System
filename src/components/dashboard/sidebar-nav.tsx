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
import { useSubscription } from "@/hooks/use-subscription"

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  featureKey?: string
}

type NavSection = {
  items: NavItem[]
  label?: string
  labelColor?: string
  isPlatform?: boolean
}

const baseNav: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Appointments", href: "/appointments", icon: CalendarDays },
  { name: "Patients", href: "/patients", icon: Users },
]

const operationalNav: NavItem[] = [
  { name: "New Visit", href: "/reception/new", icon: UserPlus },
  { name: "Waiting Room", href: "/waiting-room", icon: Monitor },
  { name: "Online Bookings", href: "/appointments/online", icon: Globe, featureKey: "ONLINE_BOOKING" },
]

const financialNav: NavItem[] = [
  { name: "Invoices", href: "/invoices", icon: Receipt },
]

const adminSectionNav: NavItem[] = [
  { name: "Users & Roles", href: "/admin/users", icon: Shield },
  { name: "Clinic Settings", href: "/settings/clinics", icon: Settings },
  { name: "Public Booking", href: "/book", icon: Globe, featureKey: "ONLINE_BOOKING" },
  { name: "Billing & Plan", href: "/settings/billing", icon: CreditCard },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: FileText, featureKey: "AUDIT_LOGS" },
  { name: "Branches", href: "/settings/branches", icon: Building2 },
  // ═══════════════════════════════════════════════════════════
  // ✅ FIX: Corrected typo "DOCTOR_ATTEDANCE" → "DOCTOR_ATTENDANCE"
  // ═══════════════════════════════════════════════════════════
  { name: "Doctor Attendance", href: "/doctor-attendance", icon: Activity, featureKey: "DOCTOR_ATTENDANCE" },
]

const superAdminSectionNav: NavItem[] = [
  { name: "Platform Overview", href: "/super-admin", icon: BarChart3 },
  { name: "All Clinics", href: "/super-admin/clinics", icon: Building2 },
  { name: "Platform Billing", href: "/super-admin/billing", icon: CreditCard },
  { name: "System Health", href: "/super-admin/system-health", icon: Activity },
  { name: "Feature Flags", href: "/super-admin/features", icon: Zap },
]

function getNavForRole(role: string): NavSection[] {
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN"
  const isReception = role === "RECEPTIONIST"
  const isDoctor = role === "DOCTOR"
  const isSuperAdmin = role === "SUPER_ADMIN"

  const sections: NavSection[] = []

  const mainItems: NavItem[] = [...baseNav]

  if (isReception || isAdmin) {
    mainItems.push(...operationalNav)
  }

  if (isAdmin) {
    mainItems.push(...financialNav)
  }

  sections.push({ items: mainItems })

  if (isDoctor || isReception) {
    sections.push({
      items: [{ name: "Users & Roles", href: "/admin/users", icon: Shield }],
      label: "Account",
      labelColor: "text-slate-400 dark:text-slate-500",
    })
  }

  if (isAdmin) {
    sections.push({
      items: adminSectionNav,
      label: "Administration",
      labelColor: "text-slate-400 dark:text-slate-500",
    })
  }

  if (isSuperAdmin) {
    sections.push({
      items: superAdminSectionNav,
      label: "Platform",
      labelColor: "text-primary/70",
      isPlatform: true,
    })
  }

  return sections
}

export function SidebarNav({ userRole, features }: { userRole: string; features?: Record<string, boolean> }) {
  const pathname = usePathname()
  const sections = getNavForRole(userRole)
  const { hasFeatureAccess: hookAccess } = useSubscription()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  function checkFeature(key: string): boolean {
    if (features && key in features) return features[key]
    return hookAccess(key)
  }

  function renderNavItem(item: NavItem, isPlatformStyle = false) {
    if (item.featureKey && !checkFeature(item.featureKey)) {
      return null
    }

    const active = isActive(item.href)

    if (isPlatformStyle) {
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
    }

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
  }

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto py-2">
      {sections.map((section, idx) => (
        <div key={idx}>
          {idx > 0 && (
            <Separator className="my-3 bg-gray-100 dark:bg-white/[0.06]" />
          )}
          {section.label && (
            <p
              className={cn(
                "px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest",
                section.labelColor
              )}
            >
              {section.label}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) =>
              renderNavItem(item, section.isPlatform)
            )}
          </div>
        </div>
      ))}
    </nav>
  )
}