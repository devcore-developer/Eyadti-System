"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signupSchema } from "@/lib/validations/auth";
import type { SignupInput } from "@/lib/validations/auth";
import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { randomUUID } from "crypto";
import { auditLog } from "@/lib/services/audit";
import { headers } from "next/headers";
import type { ActionResult } from "@/types";


// ─── Signup Action ──────────────────────────────────────────────────────────

export async function signupAction(values: SignupInput): Promise<ActionResult> {
  const validated = signupSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, clinicName, signupCode } = validated.data;

  if (!signupCode || signupCode.trim() === "") {
    return { success: false, error: "Activation code is required to create an account." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { success: false, error: "An account with this email already exists." };
  }

  // FIX #8: Prevent duplicate clinic names (case-insensitive)
  const existingClinic = await prisma.clinic.findFirst({
    where: { name: { equals: clinicName, mode: "insensitive" } },
    select: { id: true },
  });
  if (existingClinic) {
    return { success: false, error: "A clinic with this name already exists." };
  }

  const hashedPassword = await hashPassword(password);

  try {
    await prisma.$transaction(async (tx) => {
      // FIX #2, #3, #4: All checks inside transaction to prevent race conditions
      const codeRecord = await tx.activationCode.findFirst({
        where: { code: signupCode.trim() },
        include: { plan: true },
      });

      if (!codeRecord) {
        throw new Error("INVALID_CODE");
      }

      // FIX #4: Check status instead of just isUsed
      if (codeRecord.status !== "AVAILABLE") {
        if (codeRecord.status === "USED") {
          throw new Error("CODE_ALREADY_USED");
        }
        if (codeRecord.status === "EXPIRED") {
          throw new Error("CODE_EXPIRED");
        }
        if (codeRecord.status === "REVOKED") {
          throw new Error("CODE_REVOKED");
        }
        throw new Error("INVALID_CODE");
      }

      // FIX #3: Check expiration
      if (codeRecord.expiresAt && new Date() > codeRecord.expiresAt) {
        await tx.activationCode.update({
          where: { id: codeRecord.id },
          data: { status: "EXPIRED" },
        });
        throw new Error("CODE_EXPIRED");
      }

      if (!codeRecord.planId) {
        throw new Error("CODE_NO_PLAN");
      }

      const newUserId = randomUUID();
      const newClinicId = randomUUID();
      const newBranchId = randomUUID();

      const clinic = await tx.clinic.create({
        data: {
          id: newClinicId,
          name: clinicName,
          slug: `clinic-${newClinicId.substring(0, 8)}`,
        },
      });

      const user = await tx.user.create({
        data: {
          id: newUserId,
          name,
          email,
          password: hashedPassword,
          role: "ADMIN",
          clinicId: clinic.id,
        },
      });

      await tx.clinic.update({
        where: { id: clinic.id },
        data: { ownerId: user.id },
      });

      await tx.clinicSettings.create({
        data: { clinicId: clinic.id, clinicName },
      });

      await tx.branch.create({
        data: {
          id: newBranchId,
          clinicId: clinic.id,
          name: "Main Branch",
          code: "MAIN",
        },
      });

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + codeRecord.durationDays * 24 * 60 * 60 * 1000);

      // FIX #7: Determine trial status by code TYPE, not duration
      const status = codeRecord.type === "SIGNUP" ? "TRIAL" : "ACTIVE";

      await tx.subscription.create({
        data: {
          clinicId: clinic.id,
          planId: codeRecord.planId,
          status: status,
          startDate: startDate,
          trialEndsAt: status === "TRIAL" ? endDate : null,
          currentPeriodEnd: endDate,
          endDate: endDate,
        },
      });

      // FIX #5: Complete audit trail
      await tx.activationCode.update({
        where: { id: codeRecord.id },
        data: {
          status: "USED",
          isUsed: true,
          usedByClinicId: clinic.id,
          usedByUserId: user.id,
          usedByEmail: email,
          usedAt: new Date(),
        },
      });

      // ✅ إشعار السوبر أدمن: عيادة جديدة (داخل الـ transaction عشان نقدر نوصل لـ clinic.id)
      const { notifyNewClinicRegistered } = await import("@/lib/notifications/super-admin-notifier")
      await notifyNewClinicRegistered(clinic.id, clinicName, name);
    });
  } catch (error: any) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { success: false, error: "An account with this email already exists." };
    }

    const errorMap: Record<string, string> = {
      INVALID_CODE: "Invalid activation code.",
      CODE_ALREADY_USED: "This activation code has already been used.",
      CODE_EXPIRED: "This activation code has expired.",
      CODE_REVOKED: "This activation code has been revoked.",
      CODE_NO_PLAN: "This code is not linked to a plan. Contact admin.",
    };

    const message = errorMap[error.message];
    if (message) {
      return { success: false, error: message };
    }

    console.error("Signup Error:", error);
    return { success: false, error: "Failed to create account. Please try again." };
  }

  // Sign in after successful signup
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: true }; // Account created, redirect will handle it
    }
    throw error;
  }
}

// ─── Redeem Subscription Code Action ──────────────────────────────────────────

export async function redeemSubscriptionCode(clinicId: string, code: string): Promise<ActionResult> {
  try {
    const codeRecord = await prisma.$transaction(async (tx) => {
      // FIX #20: Race condition — all checks inside transaction
      const record = await tx.activationCode.findFirst({
        where: { code: code.trim() },
        include: { plan: true },
      });

      if (!record) throw new Error("INVALID_CODE");
      if (record.status !== "AVAILABLE") throw new Error("CODE_ALREADY_USED");
      if (record.type === "SIGNUP") throw new Error("CODE_IS_SIGNUP");

      // FIX #21: Check expiration
      if (record.expiresAt && new Date() > record.expiresAt) {
        await tx.activationCode.update({
          where: { id: record.id },
          data: { status: "EXPIRED" },
        });
        throw new Error("CODE_EXPIRED");
      }

      if (!record.planId) throw new Error("CODE_NO_PLAN");

      const subscription = await tx.subscription.findUnique({
        where: { clinicId },
      });

      if (!subscription) throw new Error("NO_SUBSCRIPTION");

      const now = new Date();
      const startDate =
        subscription.currentPeriodEnd && subscription.currentPeriodEnd > now
          ? subscription.currentPeriodEnd
          : now;
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + record.durationDays);

      const newPlanId = record.planId;

      await tx.subscription.update({
        where: { clinicId },
        data: {
          status: "ACTIVE",
          planId: newPlanId,
          currentPeriodEnd: newEndDate,
          endDate: newEndDate,
          trialEndsAt: null,
        },
      });

      // FIX #24: Complete audit trail
      await tx.activationCode.update({
        where: { id: record.id },
        data: {
          status: "USED",
          isUsed: true,
          usedByClinicId: clinicId,
          usedAt: now,
        },
      });

      return record;
    });

    return { success: true, message: "Subscription activated successfully!" };
  } catch (error: any) {
    const errorMap: Record<string, string> = {
      INVALID_CODE: "Invalid activation code.",
      CODE_ALREADY_USED: "This code has already been used.",
      CODE_IS_SIGNUP: "This is a signup code. Please use a subscription code to extend your plan.",
      CODE_EXPIRED: "This activation code has expired.",
      CODE_NO_PLAN: "This code is not linked to a plan.",
      NO_SUBSCRIPTION: "No subscription found for your clinic.",
    };

    const message = errorMap[error.message];
    if (message) return { success: false, error: message };

    console.error("Redeem error:", error);
    return { success: false, error: "Failed to redeem code." };
  }
}

// ─── Logout Action ──────────────────────────────────────────────────────────

export async function logoutAction(): Promise<ActionResult> {
  try {
    await signOut({ redirectTo: "/login" });
    return { success: true };
  } catch (error) {
    throw error;
  }
}