// src/lib/constants/features.ts

import { SubscriptionStatus } from "@prisma/client";

// ── استنتاج الـ Types تلقائياً من الكائنات ──────────────────
export type FeatureKey = keyof typeof FEATURES;
export type ResourceKey = keyof typeof RESOURCE_CONFIG;

// ── Feature Gates Configuration ──────────────────────
export const FEATURES = {
  ONLINE_BOOKING: {
    label: "Online Booking",
    description: "Allow patients to book appointments through your public portal",
    planField: "onlineBookingEnabled",
    badge: "Starter+",
  },
  ADVANCED_ANALYTICS: {
    label: "Advanced Analytics",
    description: "Detailed revenue, patient growth, and doctor performance insights",
    planField: "analyticsEnabled",
    badge: "Pro",
  },
  WHATSAPP_INTEGRATION: {
    label: "WhatsApp Integration",
    description: "Send appointment reminders and notifications via WhatsApp",
    planField: "whatsappEnabled",
    badge: "Pro",
  },
  MULTI_BRANCH: {
    label: "Multi-Branch Support",
    description: "Manage multiple clinic locations from a single dashboard",
    planField: "maxBranches",
    badge: "Pro",
  },
  AUDIT_LOGS: {
    label: "Audit Logs",
    description: "Track all system activities and changes for compliance",
    planField: "auditLogsEnabled",
    badge: "Pro",
  },
  GALLERY: {
    label: "Before/After Gallery",
    description: "Showcase cosmetic procedures with before and after photos",
    planField: "galleryEnabled",
    badge: "Pro",
  },
  DOCTOR_SCHEDULES: {
    label: "Doctor Schedules",
    description: "Advanced schedule management for multiple doctors",
    planField: "doctorSchedulesEnabled",
    badge: "Starter+",
  },
  ADVANCED_INVOICES: {
    label: "Advanced Invoicing",
    description: "Detailed invoices with taxes, discounts, and payment tracking",
    planField: "advancedInvoicesEnabled",
    badge: "Pro",
  },
  QUEUE_MANAGEMENT: {
    label: "Queue Management",
    description: "Digital patient queue system for walk-in clinics",
    planField: "queueManagementEnabled",
    badge: "Pro",
  },
  WAITING_ROOM_DISPLAY: {
    label: "Waiting Room Display",
    description: "Public display screen for patients in the waiting area",
    planField: "waitingRoomDisplayEnabled",
    badge: "Pro",
  },
} as const;

// ── Usage Limits Configuration ──────────────────────
export const RESOURCE_CONFIG = {
  DOCTORS: { label: "Doctors", singular: "doctor", icon: "Stethoscope" },
  USERS: { label: "Users", singular: "user", icon: "Users" },
  PATIENTS: { label: "Patients", singular: "patient", icon: "UserCheck" },
  BRANCHES: { label: "Branches", singular: "branch", icon: "Building2" },
  MONTHLY_VISITS: { label: "Monthly Visits", singular: "visit", icon: "Activity" },
} as const;

// ── Trials & Routing ──────────────────────────────────
export const TRIAL_DURATION_DAYS = 10;
export const DEFAULT_TRIAL_PLAN_SLUG = "starter";

export const SUBSCRIPTION_ALLOWED_PATHS = [
  "/settings/billing",
  "/settings",
  "/settings/subscriptions",
  "/api/auth",
];

export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionStatus, string> = {
  TRIAL: "bg-amber-100 text-amber-800 border-amber-200",
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  EXPIRED: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
  SUSPENDED: "bg-orange-100 text-orange-800 border-orange-200",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  TRIAL: "Trial",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  SUSPENDED: "Suspended",
};

// ── SaaS Plans Definitions ──────────────────────────
export const PLANS_CONFIG = {
  STARTER: {
    name: "Starter",
    slug: "starter",
    description: "For solo doctors and small clinics",
    monthlyPrice: 599,
    yearlyPrice: 5990,
    maxDoctors: 2,
    maxUsers: 2,
    maxPatients: 500,
    maxBranches: 1,
    maxMonthlyVisits: 200,
    onlineBookingEnabled: true,
    analyticsEnabled: false,
    whatsappEnabled: false,
    auditLogsEnabled: false,
    galleryEnabled: false,
    advancedInvoicesEnabled: false,
    doctorSchedulesEnabled: true,
    queueManagementEnabled: false,
    waitingRoomDisplayEnabled: false,
  },
  PRO: {
    name: "Professional",
    slug: "pro",
    description: "For clinics and medical centers",
    monthlyPrice: 1999,
    yearlyPrice: 19990,
    maxDoctors: 15,
    maxUsers: 15,
    maxPatients: -1,
    maxBranches: 5,
    maxMonthlyVisits: -1,
    onlineBookingEnabled: true,
    analyticsEnabled: true,
    whatsappEnabled: true,
    auditLogsEnabled: true,
    galleryEnabled: true,
    advancedInvoicesEnabled: true,
    doctorSchedulesEnabled: true,
    queueManagementEnabled: true,
    waitingRoomDisplayEnabled: true,
  },
  ENTERPRISE: {
    name: "Enterprise",
    slug: "enterprise",
    description: "Unlimited everything. Custom support",
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxDoctors: -1,
    maxUsers: -1,
    maxPatients: -1,
    maxBranches: -1,
    maxMonthlyVisits: -1,
    onlineBookingEnabled: true,
    analyticsEnabled: true,
    whatsappEnabled: true,
    auditLogsEnabled: true,
    galleryEnabled: true,
    advancedInvoicesEnabled: true,
    doctorSchedulesEnabled: true,
    queueManagementEnabled: true,
    waitingRoomDisplayEnabled: true,
  },
};

// ── Usage Types (المضافة جديدة) ──────────────────────
export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number | null;
  remaining: number | null;
}

export interface UsageStat {
  resource: ResourceKey;
  current: number;
  limit: number | null;
  label: string;
  icon: string;
}