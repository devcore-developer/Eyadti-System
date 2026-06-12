import { z } from "zod"

// ── Patient Schemas ──────────────────────
export const patientCreateSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().optional().or(z.literal("")),
})

export const patientUpdateSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().optional().or(z.literal("")),
})

// ── History & Allergies Schemas ──────────────
export const allergySchema = z.object({
  allergen: z.string().min(1, "Allergen is required"),
  reaction: z.string().optional(),
  severity: z.string().optional(),
  notes: z.string().optional(),
})

export const medicalHistorySchema = z.object({
  condition: z.string().min(1, "Condition is required"),
  status: z.string().optional(),
  diagnosedAt: z.string().optional(),
  notes: z.string().optional(),
})

export const surgicalHistorySchema = z.object({
  procedure: z.string().min(1, "Procedure is required"),
  performedAt: z.string().optional(),
  notes: z.string().optional(),
})