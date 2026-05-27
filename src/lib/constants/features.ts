// src/lib/constants/features.ts

import { SubscriptionStatus } from "@prisma/client"; // ← الـ import كان غلط مكانه في الكود القديم
import { FeatureKey, ResourceKey } from "@/types/subscription";

export const FEATURES: Record<
  FeatureKey,
  {
    label: string;
    description: string;
    planField: string;
    badge: string;
  }
> = {
  ONLINE_BOOKING: {
    label: "Online Booking",
    description:
      "Allow patients to book appointments through your public portal",
    planField: "onlineBookingEnabled",
    badge: "Popular",
  },
  ADVANCED_ANALYTICS: {
    label: "Advanced Analytics",
    description:
      "Detailed revenue, patient growth, and doctor performance insights",
    planField: "analyticsEnabled",
    badge: "Pro",
  },
  WHATSAPP_INTEGRATION: {
    label: "WhatsApp Integration",
    description:
      "Send appointment reminders and notifications via WhatsApp",
    planField: "notificationsEnabled",
    badge: "Pro",
  },
  MULTI_BRANCH: {
    label: "Multi-Branch Support",
    description:
      "Manage multiple clinic locations from a single dashboard",
    planField: "maxBranches",
    badge: "Enterprise",
  },
  NOTIFICATIONS: {
    label: "Notification Engine",
    description:
      "In-app and future SMS/WhatsApp notification system",
    planField: "notificationsEnabled",
    badge: "Pro",
  },
};

export const RESOURCE_CONFIG: Record<
  ResourceKey,
  { label: string; singular: string; icon: string }
> = {
  DOCTORS: { label: "Doctors", singular: "doctor", icon: "Stethoscope" },
  USERS: { label: "Users", singular: "user", icon: "Users" },
  PATIENTS: { label: "Patients", singular: "patient", icon: "UserCheck" },
  BRANCHES: { label: "Branches", singular: "branch", icon: "Building2" },
};

export const TRIAL_DURATION_DAYS = 14;

export const DEFAULT_TRIAL_PLAN_SLUG = "basic";

export const SUBSCRIPTION_ALLOWED_PATHS = [
  "/settings/billing",
  "/settings",
  "/settings/subscriptions",
  "/api/auth",
];

export const SUBSCRIPTION_STATUS_COLORS: Record<
  SubscriptionStatus,
  string
> = {
  TRIAL: "bg-amber-100 text-amber-800 border-amber-200",
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  EXPIRED: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
  SUSPENDED: "bg-orange-100 text-orange-800 border-orange-200",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<
  SubscriptionStatus,
  string
> = {
  TRIAL: "Trial",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  SUSPENDED: "Suspended",
};