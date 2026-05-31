import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SubscriptionStatus } from "@prisma/client";

// ✅ شيلنا الـ declare module من هنا عشان ميتعارضش مع ملف next-auth.d.ts

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("البريد الإلكتروني وكلمة المرور مطلوبان");
        }

        // ✅ تحويل النص لـ string عشان Prisma يقبلو (الخطأ التالت)
        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }

        // ✅ رجعنا البيانات الأساسية فقط اللي في الـ User interface (الخطأ التاني)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clinicId: user.clinicId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // 1. لما المستخدم يسجل دخول لأول مرة
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.clinicId = user.clinicId;
        
        // هنا هنجيب بيانات الاشتراك أول مرة
        if (user.clinicId) {
          const subscription = await prisma.subscription.findUnique({
            where: { clinicId: user.clinicId },
          });
          if (subscription) {
            token.subscriptionStatus = subscription.status;
            token.planId = subscription.planId;
            token.trialEndsAt = subscription.trialEndsAt;
            token.currentPeriodEnd = subscription.currentPeriodEnd;
          } else {
            token.subscriptionStatus = "EXPIRED";
            token.planId = null;
            token.trialEndsAt = null;
            token.currentPeriodEnd = null;
          }
        } else {
          token.subscriptionStatus = "SUPER_ADMIN";
          token.planId = null;
          token.trialEndsAt = null;
          token.currentPeriodEnd = null;
        }
      }

      // 2. لما نطلب تحديث الـ Session من الـ Frontend (بعد تجديد الاشتراك)
      if (trigger === "update") {
        if (token.clinicId) {
          const subscription = await prisma.subscription.findUnique({
            where: { clinicId: token.clinicId as string },
          });
          if (subscription) {
            token.subscriptionStatus = subscription.status;
            token.planId = subscription.planId;
            token.trialEndsAt = subscription.trialEndsAt;
            token.currentPeriodEnd = subscription.currentPeriodEnd;
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.clinicId = token.clinicId as string;
        // ✅ التعديل هنا عشان يتوافق مع النوع الجديد في next-auth.d.ts (الخطأ الرابع)
        session.user.subscriptionStatus = token.subscriptionStatus as SubscriptionStatus | "SUPER_ADMIN" | "EXPIRED" | null;
        session.user.planId = token.planId as string | null;
        session.user.trialEndsAt = token.trialEndsAt as Date | null;
        session.user.currentPeriodEnd = token.currentPeriodEnd as Date | null;
      }
      return session;
    },
  },
});