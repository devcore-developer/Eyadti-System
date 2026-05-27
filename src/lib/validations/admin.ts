// src/lib/validations/admin.ts
import { z } from "zod"
import { Role } from "@prisma/client"

// ─── User Schemas ────────────────────────────────────────────────────
export const createUserSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(Role, {
    message: "Please select a valid role", // التعديل هنا: استخدمنا message بدل required_error
  }),
})

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  role: z.nativeEnum(Role, {
    message: "Please select a valid role", // التعديل هنا
  }),
  // الباسورد اختياري في التعديل (لو مكتبناشش هيفضل القديم)
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
})

// ─── Clinic Schema ──────────────────────────────────────────────────
export const updateClinicSchema = z.object({
  name: z.string().min(2, "Clinic name is required").max(200),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UpdateClinicInput = z.infer<typeof updateClinicSchema>