import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Settings, Shield, CreditCard, Bell, ArrowRight, Building2 } from "lucide-react"

const allSettingsLinks = [
  {
    name: "Clinic Settings",
    description: "Manage clinic name, logo, working hours, and doctor schedules",
    href: "/settings/clinics",
    icon: Building2,
    color: "bg-blue-100 text-blue-600",
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    name: "Users & Roles",
    description: "Add, edit, or remove users and manage their permissions",
    href: "/admin/users",
    icon: Shield,
    color: "bg-purple-100 text-purple-600",
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    name: "Billing & Subscription",
    description: "Manage your plan, view usage limits, and upgrade your subscription",
    href: "/settings/billing",
    icon: CreditCard,
    color: "bg-teal-100 text-teal-600",
    roles: ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"],
  },
  {
    name: "Notification Settings",
    description: "Configure in-app, email, and SMS notification preferences",
    href: "/settings/notifications",
    icon: Bell,
    color: "bg-amber-100 text-amber-600",
    roles: ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST", "DOCTOR"],
  },
]

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userRole = session.user.role
  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN"

  // Filter links based on role — no more custom Doctor "My Account" section
  const visibleLinks = allSettingsLinks.filter((link) => link.roles.includes(userRole))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your clinic configuration and subscription
        </p>
      </div>

      <div className="grid gap-4">
        {visibleLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="group flex items-center justify-between p-6 bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${link.color}`}>
                <link.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                  {link.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{link.description}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  )
}