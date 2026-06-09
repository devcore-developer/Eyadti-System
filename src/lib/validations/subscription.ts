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
  maxDoctors: z.coerce
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  maxUsers: z.coerce.number().int().positive().nullable().optional(),
  maxPatients: z.coerce.number().int().positive().nullable().optional(),
  maxBranches: z.coerce.number().int().positive().nullable().optional(),
  maxMonthlyVisits: z.coerce.number().int().positive().nullable().optional(), // ← جديد
  onlineBookingEnabled: z.boolean().default(false),
  analyticsEnabled: z.boolean().default(false),
  whatsappEnabled: z.boolean().default(false), // ← بدل whatsappEnabled
  auditLogsEnabled: z.boolean().default(false), // ← جديد
  galleryEnabled: z.boolean().default(false), // ← جديد
  advancedInvoicesEnabled: z.boolean().default(false), // ← جديد
  doctorSchedulesEnabled: z.boolean().default(true), // ← جديد
  queueManagementEnabled: z.boolean().default(false), // ← جديد
  waitingRoomDisplayEnabled: z.boolean().default(false), // ← جديد
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
  resource: z.enum(["DOCTORS", "USERS", "PATIENTS", "BRANCHES", "MONTHLY_VISITS"]), // ← أضفنا الزيارات
});

// ─── Feature Check Schema ─────────────────────────────────────

export const featureCheckSchema = z.object({
  clinicId: z.string().cuid(),
  feature: z.enum([
    "ONLINE_BOOKING",
    "ADVANCED_ANALYTICS",
    "WHATSAPP_INTEGRATION",
    "MULTI_BRANCH",
    "AUDIT_LOGS",
    "GALLERY",
    "DOCTOR_SCHEDULES",
    "ADVANCED_INVOICES",
    "QUEUE_MANAGEMENT",
    "WAITING_ROOM_DISPLAY",
  ]), // ← تم تحديث الميزات لتطابق النظام الجديد
});

// ─── Inferred Types ───────────────────────────────────────────

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type UsageCheckInput = z.infer<typeof usageCheckSchema>;
export type FeatureCheckInput = z.infer<typeof featureCheckSchema>;