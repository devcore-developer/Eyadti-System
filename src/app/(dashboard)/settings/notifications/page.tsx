import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getNotificationSettings } from "@/lib/actions/notifications"
import { NotificationSettingsForm } from "@/components/notifications/notification-settings-form"

export const dynamic = "force-dynamic"

export default async function NotificationSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const settings = await getNotificationSettings(session.user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-sm text-muted-foreground">Manage how you receive alerts</p>
      </div>

      <NotificationSettingsForm userId={session.user.id} settings={settings} />
    </div>
  )
}