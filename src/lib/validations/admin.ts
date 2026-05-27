// src/lib/validations/admin.ts
import { z } from "zod"
import { Role } from "@prisma/client"

// ─── User Schemas ────────────────────────────────────────────────────
export const createUserSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(Role, {
    message: "Please select a valid role",
  }),
})

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  role: z.nativeEnum(Role, {
    message: "Please select a valid role",
  }),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
})

// ─── Clinic Schema ──────────────────────────────────────────────────
export const updateClinicSchema = z.object({
  name: z.string().min(2, "Clinic name is required").max(200),
  // ✅ التعديل هنا: قبول أي نص (حتى لو فاضي) طول ما الـ max متعديش
  phone: z.string().max(20, "Phone is too long").optional().default(""),
  address: z.string().max(500, "Address is too long").optional().default(""),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UpdateClinicInput = z.infer<typeof updateClinicSchema>