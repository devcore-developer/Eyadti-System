// src/lib/validations/booking.ts

import { z } from "zod"

export const bookingFormSchema = z.object({
  doctorId: z.string().min(1, "Please select a doctor"),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a time slot"),
  fullName: z.string().min(2, "Name is required").max(100),
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, "Invalid phone number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Gender is required" }),
  dateOfBirth: z.string().optional(),
  notes: z.string().max(500).optional(),
})

export type BookingFormInput = z.infer<typeof bookingFormSchema>