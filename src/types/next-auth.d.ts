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
      subscriptionStatus: SubscriptionStatus | null;
      planId: string | null;
      planSlug?: string | null;
      trialEndsAt: Date | null;
    };
  }

  // ✅ التعديل هنا: إضافة User interface عشان NextAuth يسمح بمرور role و clinicId
  interface User extends DefaultUser {
    role: string;
    clinicId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    clinicId: string;
    subscriptionStatus: SubscriptionStatus | null;
    planId: string | null;
    trialEndsAt: Date | null;
  }
}