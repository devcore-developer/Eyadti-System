// src/types/subscription.ts

import { SubscriptionStatus } from "@prisma/client";

// ─── Feature Keys ─────────────────────────────────────────────
export type FeatureKey =
  | "ONLINE_BOOKING"
  | "ADVANCED_ANALYTICS"
  | "WHATSAPP_INTEGRATION"
  | "MULTI_BRANCH"
  | "NOTIFICATIONS";

// ─── Resource Keys ────────────────────────────────────────────
export type ResourceKey = "DOCTORS" | "USERS" | "PATIENTS" | "BRANCHES";

// ─── Plan ─────────────────────────────────────────────────────
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
  onlineBookingEnabled: boolean;
  analyticsEnabled: boolean;
  notificationsEnabled: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanWithUsage extends PlanType {
  subscriptionCount: number;
}

// ─── Subscription ─────────────────────────────────────────────
export interface SubscriptionType {
  id: string;
  clinicId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date | null;
  trialEndsAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  plan: PlanType;
}

// ─── Usage ────────────────────────────────────────────────────
export interface UsageStat {
  resource: ResourceKey;
  current: number;
  limit: number | null; // null = unlimited
  label: string;
  icon: string;
}

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number | null;
  remaining: number | null;
}

// ─── Billing Overview ─────────────────────────────────────────
export interface BillingOverview {
  subscription: SubscriptionType;
  usage: UsageStat[];
  trialDaysRemaining: number | null;
  isTrialActive: boolean;
  canUpgrade: boolean;
}

// ─── Billing Cycle ────────────────────────────────────────────
export type BillingCycle = "MONTHLY" | "YEARLY";