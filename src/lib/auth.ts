// src/lib/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { Role, SubscriptionStatus } from "@prisma/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const { prisma } = await import("@/lib/db")
          const { compare } = await import("bcryptjs")

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          })

          if (!user || !user.password || !(await compare(credentials.password as string, user.password))) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            clinicId: user.clinicId,
          }
        } catch (error) {
          console.error("Auth Error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }: any) {
      if (user) {
        token.id = user.id
        token.role = user.role as Role
        token.clinicId = user.clinicId as string
        
        try {
          const { prisma } = await import("@/lib/db")
          const subscription = await prisma.subscription.findUnique({
            where: { clinicId: user.clinicId },
            // ✅ أضفنا endDate هنا
            select: { status: true, planId: true, trialEndsAt: true, endDate: true }
          })
          token.subscriptionStatus = subscription?.status || null
          token.planId = subscription?.planId || null
          token.trialEndsAt = subscription?.trialEndsAt || null
          token.currentPeriodEnd = subscription?.endDate || null // ← الجديد
        } catch(e) {
          console.error("Failed to fetch subscription in JWT callback", e)
        }
      }

      if (trigger === "update" && token.clinicId) {
         try {
          const { prisma } = await import("@/lib/db")
          const subscription = await prisma.subscription.findUnique({
            where: { clinicId: token.clinicId },
            // ✅ أضفنا endDate هنا
            select: { status: true, planId: true, trialEndsAt: true, endDate: true }
          })
          token.subscriptionStatus = subscription?.status || null
          token.planId = subscription?.planId || null
          token.trialEndsAt = subscription?.trialEndsAt || null
          token.currentPeriodEnd = subscription?.endDate || null // ← الجديد
        } catch(e) {
          console.error("Failed to fetch subscription on update", e)
        }
      }

      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.clinicId = token.clinicId as string
        
        session.user.subscriptionStatus = token.subscriptionStatus as SubscriptionStatus | null
        session.user.planId = token.planId as string | null
        session.user.trialEndsAt = token.trialEndsAt as Date | null
        session.user.currentPeriodEnd = token.currentPeriodEnd as Date | null // ← الجديد
      }
      return session
    },
  },
})