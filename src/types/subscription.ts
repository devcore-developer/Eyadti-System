// src/types/subscription.ts - أضف DOCTOR_ATTENDANCE للـ FeatureKey

import { SubscriptionStatus } from "@prisma/client";
import { type FeatureKey, type ResourceKey, type UsageStat } from "@/lib/constants/features";

// إعادة تصدير الـ Types من ملف الكونفج المركزي
export type { FeatureKey, ResourceKey, UsageStat };
export type BillingCycle = "MONTHLY" | "YEARLY";

export interface PlanType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  maxDoctors: number;
  maxUsers: number;
  maxPatients: number;
  maxBranches: number;
  maxMonthlyVisits: number;
  onlineBookingEnabled: boolean;
  analyticsEnabled: boolean;
  whatsappEnabled: boolean;
  auditLogsEnabled: boolean;
  galleryEnabled: boolean;
  advancedInvoicesEnabled: boolean;
  doctorSchedulesEnabled: boolean;
  doctorAttendanceEnabled: boolean;
  queueManagementEnabled: boolean;
  waitingRoomDisplayEnabled: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionType {
  id: string;
  clinicId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date | null;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  cancelledAt: Date | null;
  amountPaid: number | null;
  billingCycle: string | null;
  plan: PlanType;
}

export interface PlanWithUsage extends PlanType {
  subscriptionCount: number;
}

export interface BillingOverview {
  subscription: SubscriptionType | null;
  usage: UsageStat[];
  trialDaysRemaining: number | null;
  isTrialActive: boolean;
  canUpgrade: boolean;
}

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  codes?: string[];
  data?: T;
  redirectTo?: string;
};

export type PaymentWorkflowType = "PAY_BEFORE_VISIT" | "PAY_AFTER_VISIT" | "SPLIT_PAYMENT";

export * from "./subscription";
export * from "./audit";
export * from "./branch";