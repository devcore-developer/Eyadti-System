// src/lib/constants/features.ts

import { SubscriptionStatus } from "@prisma/client";

// ── استنتاج الـ Types تلقائياً من الكائنات ──────────────────
export type FeatureKey = keyof typeof FEATURES;
export type ResourceKey = keyof typeof RESOURCE_CONFIG;

// ── Trial Configuration ──────────────────────────────────────
export const TRIAL_DURATION_DAYS = 7;
export const DEFAULT_TRIAL_PLAN_SLUG = "standard";

// ── Feature Gates Configuration ──────────────────────────────
export const FEATURES = {
  ONLINE_BOOKING: {
    label: "Online Booking",
    description: "Allow patients to book appointments through your public portal",
    planField: "onlineBookingEnabled",
    badge: "Professional+",
  },
  DOCTOR_SCHEDULES: {
    label: "Doctor Schedules",
    description: "Basic schedule management for doctors across branches",
    planField: "doctorSchedulesEnabled",
    badge: "Standard+",
  },
  DOCTOR_ATTENDANCE: {
    label: "Doctor Attendance",
    description: "Track doctor check-in, check-out, absence, and branch presence",
    planField: "doctorAttendanceEnabled",
    badge: "Professional",
  },
  ADVANCED_ANALYTICS: {
    label: "Advanced Analytics",
    description: "Detailed revenue, patient growth, and doctor performance insights",
    planField: "analyticsEnabled",
    badge: "Standard+",
  },
  WHATSAPP_INTEGRATION: {
    label: "WhatsApp Integration",
    description: "Send appointment reminders and notifications via WhatsApp",
    planField: "whatsappEnabled",
    badge: "Professional",
  },
  MULTI_BRANCH: {
    label: "Multi-Branch Support",
    description: "Manage multiple clinic locations from a single dashboard",
    planField: "maxBranches",
    badge: "Professional",
  },
  AUDIT_LOGS: {
    label: "Audit Logs",
    description: "Track all system activities and changes for compliance",
    planField: "auditLogsEnabled",
    badge: "Professional",
  },
  GALLERY: {
    label: "Before/After Gallery",
    description: "Showcase cosmetic procedures with before and after photos",
    planField: "galleryEnabled",
    badge: "Professional",
  },
  ADVANCED_INVOICES: {
    label: "Advanced Invoicing",
    description: "Detailed invoices with taxes, discounts, and payment tracking",
    planField: "advancedInvoicesEnabled",
    badge: "Professional",
  },
  QUEUE_MANAGEMENT: {
    label: "Queue Management",
    description: "Digital patient queue system for walk-in clinics",
    planField: "queueManagementEnabled",
    badge: "Professional",
  },
  WAITING_ROOM_DISPLAY: {
    label: "Waiting Room Display",
    description: "Public display screen for patients in the waiting area",
    planField: "waitingRoomDisplayEnabled",
    badge: "Professional",
  },
} as const;

// ── Usage Limits Configuration ──────────────────────────────
export const RESOURCE_CONFIG = {
  DOCTORS: { label: "Doctors", singular: "doctor", icon: "Stethoscope" },
  USERS: { label: "Users", singular: "user", icon: "Users" },
  PATIENTS: { label: "Patients", singular: "patient", icon: "UserCheck" },
  BRANCHES: { label: "Branches", singular: "branch", icon: "Building2" },
  MONTHLY_VISITS: { label: "Monthly Visits", singular: "visit", icon: "Activity" },
} as const;

// ── Routing ──────────────────────────────────────────────────
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

// ── SaaS Plans Definitions ──────────────────────────────────
// ⚠️ REFERENCE ONLY for seeding scripts.
// The ACTUAL plan data lives in the DATABASE.
// NEVER use these for feature checks or pricing display.
// Always read from DB via getSubscription() or prisma.plan.findFirst()
export const PLANS_CONFIG = {
  STANDARD: {
    name: "Standard",
    slug: "standard",
    description: "For small clinics and solo doctors",
    monthlyPrice: 600,
    yearlyPrice: 6000,
    maxDoctors: 2,
    maxUsers: 3,              
    maxPatients: 500,
    maxBranches: 1,
    maxMonthlyVisits: 200,    
    onlineBookingEnabled: false,
    analyticsEnabled: true, // ✅ تم تفعيله للـ Standard
    whatsappEnabled: false,
    auditLogsEnabled: false,
    galleryEnabled: false,
    advancedInvoicesEnabled: false,
    doctorSchedulesEnabled: true,
    doctorAttendanceEnabled: false,
    queueManagementEnabled: false,
    waitingRoomDisplayEnabled: false,
  },
  PROFESSIONAL: {
    name: "Professional",
    slug: "professional",
    description: "For growing clinics and medical centers",
    monthlyPrice: 1000,
    yearlyPrice: 10000,
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
    doctorAttendanceEnabled: true,
    queueManagementEnabled: true,
    waitingRoomDisplayEnabled: true,
  },
  ENTERPRISE: {
    name: "Enterprise",
    slug: "enterprise",
    description: "For large clinics, hospitals, and organizations",
    monthlyPrice: 2000,
    yearlyPrice: 20000,
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
    doctorAttendanceEnabled: true,
    queueManagementEnabled: true,
    waitingRoomDisplayEnabled: true,
  },
};

// ── Feature Matrix (for display purposes) ───────────────────
export const FEATURE_MATRIX = {
  standard: {
    name: "Standard",
    features: [
      // ✅ Core Features المضافة لتبدو الخطة جذابة
      { key: "Patient Management", included: true },
      { key: "Patient Profiles & Medical Files", included: true },
      { key: "New Visit & Consultation", included: true },
      { key: "Appointments & Scheduling", included: true },
      { key: "Waiting Room Queue", included: true },
      { key: "Invoices & Basic Billing", included: true },
      { key: "Digital Prescriptions", included: true },
      { key: "Basic Branch Management", included: true },
      { key: "Basic Dashboard", included: true },
      { key: "Basic Reports", included: true },
      { key: "Basic Clinic Settings", included: true },
      { key: "Basic User Management", included: true },
      { key: "Basic Notifications", included: true },
      { key: "Doctor Schedules", included: true },
      // ❌ Blocked Features
      { key: "Online Booking", included: false },
      { key: "Doctor Attendance", included: false },
      { key: "Advanced Analytics", included: true }, // ✅ تم تفعيله
      { key: "WhatsApp Automation", included: false },
      { key: "Audit Logs", included: false },
      { key: "Before/After Gallery", included: false },
    ],
  },
  professional: {
    name: "Professional",
    features: [
      { key: "Everything in Standard", included: true },
      { key: "Doctor Attendance", included: true },
      { key: "Doctor Check-in / Check-out", included: true },
      { key: "Doctor Absence Tracking", included: true },
      { key: "Doctor Branch Scheduling", included: true },
      { key: "Advanced Analytics", included: true },
      { key: "Advanced Dashboard", included: true },
      { key: "Advanced Reports", included: true },
      { key: "Revenue Analytics", included: true },
      { key: "Patient Analytics", included: true },
      { key: "Appointment Analytics", included: true },
      { key: "WhatsApp Integration", included: true },
      { key: "WhatsApp Notifications", included: true },
      { key: "Multi-Branch Support", included: true },
      { key: "Audit Logs", included: true },
      { key: "Before/After Gallery", included: true },
      { key: "Advanced Invoicing", included: true },
      { key: "Queue Management", included: true },
      { key: "Waiting Room Display", included: true },
    ],
  },
  enterprise: {
    name: "Enterprise",
    features: [
      { key: "Everything in Professional", included: true },
      { key: "Advanced Multi-Branch Management", included: true },
      { key: "Large Clinic / Hospital Workflows", included: true },
      { key: "Advanced Administration", included: true },
      { key: "Higher Limits", included: true },
      { key: "Advanced Integrations", included: true },
      { key: "Custom Integrations", included: true },
      { key: "Advanced WhatsApp Automation", included: true },
      { key: "Priority Support", included: true },
      { key: "Custom Configuration", included: true },
      { key: "Enterprise Onboarding", included: true },
    ],
  },
} as const;

// ── Usage Types ──────────────────────────────────────────────
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