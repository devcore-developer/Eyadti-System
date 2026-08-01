import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { comparePassword } from "@/lib/password";
import { SubscriptionStatus } from "@prisma/client";
import { checkAndExpireTrials } from "./services/trial-system";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
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
          throw new Error("Email and password are required.");
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          throw new Error("Incorrect email or password.");
        }

        // FIX #11: Use comparePassword from password.ts
        const isValidPassword = await comparePassword(password, user.password);

        if (!isValidPassword) {
          throw new Error("Incorrect email or password.");
        }

        // FIX #6: Account status guard
        if (user.status === "SUSPENDED") {
          throw new Error("This account has been suspended. Please contact support.");
        }

        if (user.status === "INACTIVE") {
          throw new Error("This account is not active yet.");
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
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.clinicId = user.clinicId;
        
        if (user.clinicId) {
          await checkAndExpireTrials(user.clinicId);
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

      if (trigger === "update") {
        if (token.clinicId) {
          await checkAndExpireTrials(token.clinicId as string);
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
        session.user.subscriptionStatus = token.subscriptionStatus as SubscriptionStatus | "SUPER_ADMIN" | "EXPIRED" | null;
        session.user.planId = token.planId as string | null;
        session.user.trialEndsAt = token.trialEndsAt as Date | null;
        session.user.currentPeriodEnd = token.currentPeriodEnd as Date | null;
      }
      return session;
    },
  },
});