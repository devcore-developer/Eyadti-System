// src/lib/validations/invoice.ts
import { z } from "zod"
import { InvoiceStatus } from "@prisma/client"

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1").int("Quantity must be a whole number"),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative"),
})

export const invoiceCreateSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  items: z.array(invoiceItemSchema).min(1, "Invoice must have at least one item"),
})

export const updateInvoiceStatusSchema = z.object({
  status: z.nativeEnum(InvoiceStatus, {
    message: "Invalid status",
  }),
})

export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>
export type InvoiceUpdateStatusInput = z.infer<typeof updateInvoiceStatusSchema>