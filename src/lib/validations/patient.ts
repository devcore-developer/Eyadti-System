// src/lib/validations/patient.ts
import { z } from "zod"

export const patientCreateSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(200),
  phone: z.string().min(1, "Phone is required").max(20),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.string().min(1, "Date of birth is required"), // هيتحول لـ Date في الـ Action
  address: z.string().max(500).optional().or(z.literal("")),
})

export const patientUpdateSchema = patientCreateSchema

export type PatientCreateInput = z.infer<typeof patientCreateSchema>
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>