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
  maxMonthlyVisits: number; // ← جديد
  onlineBookingEnabled: boolean;
  analyticsEnabled: boolean;
  whatsappEnabled: boolean; // ← بدل whatsappEnabled
  auditLogsEnabled: boolean;
  galleryEnabled: boolean;
  advancedInvoicesEnabled: boolean;
  doctorSchedulesEnabled: boolean;
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