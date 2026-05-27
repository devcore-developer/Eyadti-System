// src/lib/validations/branch.ts
import { z } from "zod"

export const branchCreateSchema = z.object({
  name: z.string().min(2, "Branch name must be at least 2 characters"),
  code: z.string().min(1, "Branch code is required").max(10),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  phone: z.string().min(8, "Phone number seems too short"), // تم التبسيط
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  managerId: z.string().optional().or(z.literal("")),
})

export const branchUpdateSchema = z.object({
  name: z.string().min(2, "Branch name must be at least 2 characters"),
  code: z.string().min(1, "Branch code is required").max(10),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  phone: z.string().min(8, "Phone number seems too short"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  managerId: z.string().optional().or(z.literal("")),
})

export type BranchCreateInput = z.infer<typeof branchCreateSchema>
export type BranchUpdateInput = z.infer<typeof branchUpdateSchema>