"use client"

import { useState } from "react"
import { updateNotificationSettings } from "@/lib/actions/notifications"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Save, Bell } from "lucide-react"

interface NotificationSettingsFormProps {
  userId: string
  settings: any
}

export function NotificationSettingsForm({ userId, settings }: NotificationSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    enableInApp: settings?.enableInApp ?? true,
    enableEmail: settings?.enableEmail ?? false,
    enableSMS: settings?.enableSMS ?? false,
    enableWhatsApp: settings?.enableWhatsApp ?? false,
    appointmentReminders: settings?.appointmentReminders ?? true,
    invoiceNotifications: settings?.invoiceNotifications ?? true,
    systemNotifications: settings?.systemNotifications ?? true,
  })

  const handleToggle = (field: string) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const onSubmit = async () => {
    setIsSubmitting(true)
    const result = await updateNotificationSettings(userId, formData)
    if (result.success) {
      alert("Notification settings saved!")
    } else {
      alert("Failed to save settings")
    }
    setIsSubmitting(false)
  }

  const toggles = [
    { key: "enableInApp", label: "In-App Notifications", desc: "Receive alerts inside the system." },
    { key: "enableEmail", label: "Email Notifications", desc: "Receive email alerts (Coming Soon)." },
    { key: "enableSMS", label: "SMS Notifications", desc: "Receive SMS alerts (Coming Soon)." },
    { key: "enableWhatsApp", label: "WhatsApp Notifications", desc: "Receive WhatsApp alerts (Coming Soon)." },
    { key: "appointmentReminders", label: "Appointment Reminders", desc: "Get reminders before appointments." },
    { key: "invoiceNotifications", label: "Invoice & Payment Alerts", desc: "Notify on invoice creation/payment." },
    { key: "systemNotifications", label: "System Alerts", desc: "Important system announcements." },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-indigo-600" />
          <div>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose how and when you want to be notified.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {toggles.map((toggle) => (
          <div key={toggle.key} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">{toggle.label}</p>
              <p className="text-xs text-muted-foreground">{toggle.desc}</p>
            </div>
            <input
              type="checkbox"
              checked={formData[toggle.key as keyof typeof formData] as boolean}
              onChange={() => handleToggle(toggle.key)}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <Button onClick={onSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}