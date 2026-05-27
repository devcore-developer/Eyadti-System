// src/lib/validations/settings.ts

import { z } from "zod"

export const clinicSettingsSchema = z.object({
  clinicName: z.string().min(2, "Clinic name must be at least 2 characters"),
  address: z.string().optional().or(z.literal("")),
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, "Invalid phone number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  taxNumber: z.string().optional().or(z.literal("")),
  currency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
  // ↓↓↓ التعديل هنا: شلنا coerce وخليها z.number() عادي ↓↓↓
  defaultAppointmentDuration: z.number().min(5, "Min 5 mins").max(480, "Max 8 hours"),
  dateFormat: z.string().min(1),
  timeFormat: z.enum(["12h", "24h"]),
  enableNotifications: z.boolean(),
  enableOnlineBooking: z.boolean(),
})

export const workingHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time (HH:MM)"),
  isClosed: z.boolean(),
})

export const workingHoursArraySchema = z.array(workingHoursSchema)

export const doctorScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time (HH:MM)"),
  isAvailable: z.boolean(),
})

export const doctorScheduleArraySchema = z.array(doctorScheduleSchema)

export type ClinicSettingsInput = z.infer<typeof clinicSettingsSchema>
export type WorkingHoursInput = z.infer<typeof workingHoursSchema>
export type DoctorScheduleInput = z.infer<typeof doctorScheduleSchema>