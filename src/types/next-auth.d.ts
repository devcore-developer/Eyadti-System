// src/types/next-auth.d.ts
import { SubscriptionStatus } from "@prisma/client";
import { DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      clinicId: string;
      subscriptionStatus: SubscriptionStatus | "SUPER_ADMIN" | "EXPIRED" | null;
      planId: string | null;
      planSlug?: string | null;
      trialEndsAt: Date | null;
      currentPeriodEnd: Date | null;
    };
  }

  // ✅ شلنا الخصائص بتاعة الاشتراك من هنا عشان الـ authorize يرضى
  interface User extends DefaultUser {
    role: string;
    clinicId: string;
  }
}

// ✅ التعديل السحري هنا: غيرنا المسار من next-auth/jwt لـ @auth/core/jwt
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: string;
    clinicId: string;
    subscriptionStatus: SubscriptionStatus | "SUPER_ADMIN" | "EXPIRED" | null;
    planId: string | null;
    planSlug?: string | null;
    trialEndsAt: Date | null;
    currentPeriodEnd: Date | null;
  }
}