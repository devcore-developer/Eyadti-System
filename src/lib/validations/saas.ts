import { z } from "zod";

export const PlanSchema = z.object({
  name: z.string().min(2, "Plan name is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  description: z.string().optional(),
  monthlyPrice: z.coerce.number().min(0, "Price must be positive"),
  yearlyPrice: z.coerce.number().min(0, "Price must be positive"),
  maxDoctors: z.coerce.number().int().default(-1),
  maxUsers: z.coerce.number().int().default(-1),
  maxPatients: z.coerce.number().int().default(-1),
  maxBranches: z.coerce.number().int().default(-1),
  onlineBookingEnabled: z.boolean().default(false),
  analyticsEnabled: z.boolean().default(false),
  notificationsEnabled: z.boolean().default(true),
  active: z.boolean().default(true),
});

export const UpdateSubscriptionSchema = z.object({
  clinicId: z.string(),
  planId: z.string(),
  status: z.enum(["TRIAL", "ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED"]).optional(),
});

export type PlanInput = z.infer<typeof PlanSchema>;
export type SubscriptionInput = z.infer<typeof UpdateSubscriptionSchema>;
export {
  createPlanSchema,
  updatePlanSchema,
  archivePlanSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
  cancelSubscriptionSchema,
  usageCheckSchema,
  featureCheckSchema,
} from "./subscription";

export type {
  CreatePlanInput,
  UpdatePlanInput,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  CancelSubscriptionInput,
  UsageCheckInput,
  FeatureCheckInput,
} from "./subscription";