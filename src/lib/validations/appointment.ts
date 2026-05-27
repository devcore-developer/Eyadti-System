// src/lib/validations/appointment.ts
import { z } from "zod"
import { AppointmentStatus } from "@prisma/client"

export const appointmentCreateSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  date: z.string().min(1, "Date is required"), // هنجيبها من input type="date"
  time: z.string().min(1, "Time is required"), // هنجيبها من input type="time"
  notes: z.string().max(2000).optional().or(z.literal("")),
})

export const appointmentUpdateSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  notes: z.string().max(2000).optional().or(z.literal("")),
  // الـ Status هنغيرها في Action منفصل عشان الصلاحيات تختلف
})

export const changeAppointmentStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus, {
    message: "Invalid status", // التعديل هنا
  }),
})

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>