// src/lib/validations/booking.ts

import { z } from "zod"

export const bookingFormSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.string().min(8, "Invalid phone number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).default("MALE"),
  dateOfBirth: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  branchId: z.string().optional(),
  notes: z.string().optional(),
})
export type BookingFormInput = z.infer<typeof bookingFormSchema>