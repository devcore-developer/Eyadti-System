// src/components/settings/clinic-settings-form.tsx

"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { clinicSettingsSchema, type ClinicSettingsInput } from "@/lib/validations/settings"
import { updateClinicSettings } from "@/lib/actions/settings"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save } from "lucide-react"
import { useState } from "react"

interface ClinicSettingsFormProps {
  clinicId: string
  settings: any
  isReadOnly: boolean
}

const timezones = [
  { value: "Africa/Cairo", label: "Cairo (GMT+2)" },
  { value: "Asia/Riyadh", label: "Riyadh (GMT+3)" },
  { value: "Asia/Dubai", label: "Dubai (GMT+4)" },
  { value: "Europe/London", label: "London (GMT+0)" },
]

const currencies = [
  { value: "EGP", label: "EGP - Egyptian Pound" },
  { value: "SAR", label: "SAR - Saudi Riyal" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "USD", label: "USD - US Dollar" },
]

export function ClinicSettingsForm({ clinicId, settings, isReadOnly }: ClinicSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ClinicSettingsInput>({
    resolver: zodResolver(clinicSettingsSchema) as any,
    defaultValues: {
      clinicName: settings?.clinicName || "",
      address: settings?.address || "",
      phone: settings?.phone || "",
      email: settings?.email || "",
      website: settings?.website || "",
      taxNumber: settings?.taxNumber || "",
      currency: settings?.currency || "EGP",
      timezone: settings?.timezone || "Africa/Cairo",
      defaultAppointmentDuration: settings?.defaultAppointmentDuration || 30,
      dateFormat: settings?.dateFormat || "dd/MM/yyyy",
      timeFormat: settings?.timeFormat || "24h",
      enableNotifications: settings?.enableNotifications ?? true,
      enableOnlineBooking: settings?.enableOnlineBooking ?? false,
    },
  })

  const onSubmit = async (data: ClinicSettingsInput) => {
    setIsSubmitting(true)
    const result = await updateClinicSettings(clinicId, data)
    if (result.success) {
      alert("Settings saved successfully!")
    } else {
      alert(result.error || "Failed to save settings")
    }
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>Manage your clinic's public identity and contact details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Clinic Name *</Label>
            <Input {...form.register("clinicName")} disabled={isReadOnly} />
            {form.formState.errors.clinicName && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.clinicName.message}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <Label>Address</Label>
            <Input {...form.register("address")} disabled={isReadOnly} />
          </div>
          <div>
            <Label>Phone *</Label>
            <Input {...form.register("phone")} disabled={isReadOnly} placeholder="+20 123 456 7890" />
            {form.formState.errors.phone && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.phone.message}</p>
            )}
          </div>
          <div>
            <Label>Email</Label>
            <Input {...form.register("email")} disabled={isReadOnly} type="email" />
          </div>
          <div>
            <Label>Website</Label>
            <Input {...form.register("website")} disabled={isReadOnly} placeholder="https://" />
          </div>
          <div>
            <Label>Tax Number</Label>
            <Input {...form.register("taxNumber")} disabled={isReadOnly} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business & Locale</CardTitle>
          <CardDescription>Configure regional and operational defaults.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Currency</Label>
            <Select
              disabled={isReadOnly}
              defaultValue={form.getValues("currency") || "EGP"}
              onValueChange={(val: string | null) => { if (val) form.setValue("currency", val) }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {currencies.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Timezone</Label>
            <Select
              disabled={isReadOnly}
              defaultValue={form.getValues("timezone") || "Africa/Cairo"}
              onValueChange={(val: string | null) => { if (val) form.setValue("timezone", val) }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {timezones.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Default Appointment Duration (mins)</Label>
            {/* التعديل هنا: اضفنا valueAsNumber عشان يبعت رقم مش نص */}
            <Input 
              type="number" 
              {...form.register("defaultAppointmentDuration", { valueAsNumber: true })} 
              disabled={isReadOnly} 
            />
          </div>
          <div>
            <Label>Time Format</Label>
            <Select
              disabled={isReadOnly}
              defaultValue={form.getValues("timeFormat") || "24h"}
              onValueChange={(val: string | null) => { if (val) form.setValue("timeFormat", val as "12h" | "24h") }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24-Hour</SelectItem>
                <SelectItem value="12h">12-Hour (AM/PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Enable Notifications</p>
              <p className="text-xs text-muted-foreground">Send SMS/Email notifications.</p>
            </div>
            <input
              type="checkbox"
              checked={form.watch("enableNotifications")}
              onChange={(e) => form.setValue("enableNotifications", e.target.checked)}
              disabled={isReadOnly}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Enable Online Booking</p>
              <p className="text-xs text-muted-foreground">Allow patients to book online (Future).</p>
            </div>
            <input
              type="checkbox"
              checked={form.watch("enableOnlineBooking")}
              onChange={(e) => form.setValue("enableOnlineBooking", e.target.checked)}
              disabled={isReadOnly}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
          </div>
        </CardContent>
      </Card>

      {!isReadOnly && (
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>
        </div>
      )}
    </form>
  )
}