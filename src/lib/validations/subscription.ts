// src/lib/validations/subscription.ts - أضف DOCTOR_ATTENDANCE و doctorAttendanceEnabled

import { z } from "zod";

// ─── Plan Schemas ─────────────────────────────────────────────

export const createPlanSchema = z.object({
  name: z
    .string()
    .min(2, "Plan name must be at least 2 characters")
    .max(50, "Plan name must be at most 50 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must be at most 50 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with dashes"
    ),
  description: z.string().max(500, "Description too long").optional(),
  monthlyPrice: z.coerce
    .number()
    .min(0, "Monthly price must be 0 or greater")
    .max(99999, "Monthly price too high"),
  yearlyPrice: z.coerce
    .number()
    .min(0, "Yearly price must be 0 or greater")
    .max(999999, "Yearly price too high"),
  maxDoctors: z.coerce.number().int().min(-1).nullable().optional(),
  maxUsers: z.coerce.number().int().min(-1).nullable().optional(),
  maxPatients: z.coerce.number().int().min(-1).nullable().optional(),
  maxBranches: z.coerce.number().int().min(-1).nullable().optional(),
  maxMonthlyVisits: z.coerce.number().int().min(-1).nullable().optional(),
  onlineBookingEnabled: z.boolean().default(false),
  analyticsEnabled: z.boolean().default(false),
  whatsappEnabled: z.boolean().default(false),
  auditLogsEnabled: z.boolean().default(false),
  galleryEnabled: z.boolean().default(false),
  advancedInvoicesEnabled: z.boolean().default(false),
  doctorSchedulesEnabled: z.boolean().default(true),
  doctorAttendanceEnabled: z.boolean().default(false),
  queueManagementEnabled: z.boolean().default(false),
  waitingRoomDisplayEnabled: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const updatePlanSchema = createPlanSchema.partial().extend({
  id: z.string().cuid(),
});

export const archivePlanSchema = z.object({
  id: z.string().cuid(),
  active: z.boolean(),
});

// ─── Subscription Schemas ─────────────────────────────────────

export const createSubscriptionSchema = z.object({
  clinicId: z.string().cuid(),
  planId: z.string().cuid(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
});

export const updateSubscriptionSchema = z.object({
  planId: z.string().cuid().optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
});

export const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string().cuid(),
  reason: z.string().max(500).optional(),
});

// ─── Usage Check Schema ───────────────────────────────────────

export const usageCheckSchema = z.object({
  clinicId: z.string().cuid(),
  resource: z.enum(["DOCTORS", "USERS", "PATIENTS", "BRANCHES", "MONTHLY_VISITS"]),
});

// ─── Feature Check Schema ─────────────────────────────────────

export const featureCheckSchema = z.object({
  clinicId: z.string().cuid(),
  feature: z.enum([
    "ONLINE_BOOKING",
    "DOCTOR_SCHEDULES",
    "DOCTOR_ATTENDANCE",
    "ADVANCED_ANALYTICS",
    "WHATSAPP_INTEGRATION",
    "MULTI_BRANCH",
    "AUDIT_LOGS",
    "GALLERY",
    "ADVANCED_INVOICES",
    "QUEUE_MANAGEMENT",
    "WAITING_ROOM_DISPLAY",
  ]),
});

// ─── Inferred Types ───────────────────────────────────────────

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type UsageCheckInput = z.infer<typeof usageCheckSchema>;
export type FeatureCheckInput = z.infer<typeof featureCheckSchema>;

// ─── Clinic Lifecycle Schemas ──────────────────────────────────

export const renewSubscriptionSchema = z.object({
  clinicId: z.string().cuid(),
  daysToAdd: z.number().int().min(1).max(365),
});

export const suspendClinicSchema = z.object({
  clinicId: z.string().cuid(),
  reason: z.string().max(500).optional(),
});

export const activateClinicSchema = z.object({
  clinicId: z.string().cuid(),
});

export const archiveClinicSchema = z.object({
  clinicId: z.string().cuid(),
});

export const permanentDeleteClinicSchema = z.object({
  clinicId: z.string().cuid(),
});