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
import { Loader2, Save, CreditCard } from "lucide-react"
import { useState } from "react"
import { showSuccess, showError } from "@/components/shared/feedback-toast"
import type { PaymentWorkflowType } from "@/types"

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
      whatsappInstanceName: settings?.whatsappInstanceName || "",
    },
  })

  const onSubmit = async (data: ClinicSettingsInput) => {
    setIsSubmitting(true)
    // ⬇️⬇️⬇️ ندمج الـ Payment Workflow مع الداتا قبل الإرسال ⬇️⬇⬇️
    const finalData = {
      ...data,
      paymentWorkflow: (document.getElementById('paymentWorkflowSelect') as HTMLSelectElement)?.value || "PAY_AFTER_VISIT"
    }
    const result = await updateClinicSettings(clinicId, finalData)
    if (result.success) {
      showSuccess("Settings saved successfully")
    } else {
      showError("Failed to save", result.error || "Something went wrong")
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
            <Select disabled={isReadOnly} defaultValue={form.getValues("currency") || "EGP"} onValueChange={(val: string | null) => { if (val) form.setValue("currency", val) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {currencies.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Timezone</Label>
            <Select disabled={isReadOnly} defaultValue={form.getValues("timezone") || "Africa/Cairo"} onValueChange={(val: string | null) => { if (val) form.setValue("timezone", val) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {timezones.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Default Appointment Duration (mins)</Label>
            <Input type="number" {...form.register("defaultAppointmentDuration", { valueAsNumber: true })} disabled={isReadOnly} />
          </div>
          <div>
            <Label>Time Format</Label>
            <Select disabled={isReadOnly} defaultValue={form.getValues("timeFormat") || "24h"} onValueChange={(val: string | null) => { if (val) form.setValue("timeFormat", val as "12h" | "24h") }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24-Hour</SelectItem>
                <SelectItem value="12h">12-Hour (AM/PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ⬇️⬇️⬇️ كارت الـ Payment Workflow الجديد ⬇️⬇⬇️ */}
      <Card className="border-indigo-200 bg-indigo-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-indigo-600" /> Payment Workflow</CardTitle>
          <CardDescription>
            Choose how your clinic handles patient payments. This will affect Reception, Waiting Room, and Invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <select 
            id="paymentWorkflowSelect"
            disabled={isReadOnly} 
            defaultValue={settings?.paymentWorkflow || "PAY_AFTER_VISIT"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="PAY_AFTER_VISIT">Pay After Visit (Standard Clinics)</option>
            <option value="PAY_BEFORE_VISIT">Pay Before Visit (Pediatrics, Internal Med)</option>
            <option value="SPLIT_PAYMENT">Split Payment (Dental, Surgery, Cosmetic)</option>
          </select>
          <div className="mt-3 text-xs text-muted-foreground bg-white p-3 rounded-lg border">
            {settings?.paymentWorkflow === "PAY_BEFORE_VISIT" && "• Patient pays at reception before seeing the doctor. No billing popup after visit."}
            {settings?.paymentWorkflow === "SPLIT_PAYMENT" && "• Reception collects consultation fee. Procedure fee is billed after the doctor visit."}
            {(!settings?.paymentWorkflow || settings?.paymentWorkflow === "PAY_AFTER_VISIT") && "• Standard flow: Patient sees doctor, then goes to billing to pay the full amount."}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Integration (Evolution API)</CardTitle>
          <CardDescription>Enter the WhatsApp instance name for this clinic.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label>Instance Name</Label>
            <Input {...form.register("whatsappInstanceName")} disabled={isReadOnly} placeholder="e.g., mos_clinic" />
            {form.formState.errors.whatsappInstanceName && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.whatsappInstanceName.message}</p>
            )}
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
              <p className="text-xs text-muted-foreground">Send SMS/WhatsApp/Email notifications.</p>
            </div>
            <input type="checkbox" checked={form.watch("enableNotifications")} onChange={(e) => form.setValue("enableNotifications", e.target.checked)} disabled={isReadOnly} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Enable Online Booking</p>
              <p className="text-xs text-muted-foreground">Allow patients to book online.</p>
            </div>
            <input type="checkbox" checked={form.watch("enableOnlineBooking")} onChange={(e) => form.setValue("enableOnlineBooking", e.target.checked)} disabled={isReadOnly} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
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