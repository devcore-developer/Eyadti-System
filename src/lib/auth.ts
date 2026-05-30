import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      clinicId: string;
      subscriptionStatus: string;
      trialEndsAt: Date | null;
      currentPeriodEnd: Date | null;
    } & DefaultSession["user"];
  }
}

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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }

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
      // 1. لما المستخدم يسجل دخولو لأول مرة
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clinicId = user.clinicId;
        
        // هنا بسنجيب بيانات الاشتراك أول مرة
        if (user.clinicId) {
          const subscription = await prisma.subscription.findUnique({
            where: { clinicId: user.clinicId },
          });
          if (subscription) {
            token.subscriptionStatus = subscription.status;
            token.trialEndsAt = subscription.trialEndsAt;
            token.currentPeriodEnd = subscription.currentPeriodEnd;
          } else {
            token.subscriptionStatus = "EXPIRED";
            token.trialEndsAt = null;
            token.currentPeriodEnd = null;
          }
        } else {
          token.subscriptionStatus = "SUPER_ADMIN";
          token.trialEndsAt = null;
          token.currentPeriodEnd = null;
        }
      }

      // 2. لما نطلب تحديث الـ Session من الـ Frontend (بعد تجديد الاشتراك)
      if (trigger === "update") {
        // هنا هنروح نسأل الداتابيز تاني عشان نجيب التاريخ الجديد
        if (token.clinicId) {
          const subscription = await prisma.subscription.findUnique({
            where: { clinicId: token.clinicId as string },
          });
          if (subscription) {
            token.subscriptionStatus = subscription.status;
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
        session.user.subscriptionStatus = token.subscriptionStatus as string;
        session.user.trialEndsAt = token.trialEndsAt as Date | null;
        session.user.currentPeriodEnd = token.currentPeriodEnd as Date | null;
      }
      return session;
    },
  },
});