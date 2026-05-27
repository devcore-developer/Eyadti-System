import Link from "next/link"
import { Settings, Shield, CreditCard, Bell, ArrowRight, Building2 } from "lucide-react"

const settingsLinks = [
  {
    name: "Clinic Settings",
    description: "Manage clinic name, logo, working hours, and doctor schedules",
    href: "/settings/clinics", // ← تم التعديل ليتطابق مع هيكل الملفات
    icon: Building2, // ← غيرت الأيقونة لتكون أدق
    color: "bg-blue-100 text-blue-600",
  },
  {
    name: "Users & Roles",
    description: "Add, edit, or remove users and manage their permissions",
    href: "/admin/users",
    icon: Shield,
    color: "bg-purple-100 text-purple-600",
  },
  {
    name: "Billing & Subscription",
    description: "Manage your plan, view usage limits, and upgrade your subscription",
    href: "/settings/billing",
    icon: CreditCard,
    color: "bg-teal-100 text-teal-600",
  },
  {
    name: "Notification Settings",
    description: "Configure in-app, email, and SMS notification preferences",
    href: "/settings/notifications",
    icon: Bell,
    color: "bg-amber-100 text-amber-600",
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your clinic configuration and subscription
        </p>
      </div>

      <div className="grid gap-4">
        {settingsLinks.map((link) => (
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