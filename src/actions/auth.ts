"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import type { LoginInput, SignupInput } from "@/lib/validations/auth";
import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { randomUUID } from "crypto";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Login Action ───────────────────────────────────────────────────────────

export async function loginAction(values: LoginInput): Promise<ActionResult> {
  const validated = loginSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Incorrect email or password." };
        default:
          return { success: false, error: "An authentication error occurred." };
      }
    }
    throw error;
  }
}

// ─── Signup Action ──────────────────────────────────────────────────────────

export async function signupAction(values: SignupInput): Promise<ActionResult> {
  const validated = signupSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, clinicName, signupCode } = validated.data;

  // 1. التحقق من كود التسجيل (SIGNUP)
  const codeRecord = await prisma.activationCode.findUnique({
    where: { code: signupCode },
  });

  if (!codeRecord) {
    return { success: false, error: "Invalid signup code. Please contact the administrator." };
  }

  if (codeRecord.isUsed) {
    return { success: false, error: "This signup code has already been used." };
  }

  if (codeRecord.type !== "SIGNUP") {
    return { success: false, error: "This is not a signup code. Please enter a valid signup code." };
  }

  // 2. التأكد إن الإيميل مش مسجل
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { success: false, error: "An account with this email already exists" };
  }

  const hashedPassword = await hashPassword(password);

  // 3. إنشاء الحساب وتفعيل الكود
  try {
    await prisma.$transaction(async (tx) => {
      const newUserId = randomUUID();
      const newClinicId = randomUUID();
      const newBranchId = randomUUID();

      const clinic = await tx.clinic.create({
        data: { id: newClinicId, name: clinicName },
      });

      const user = await tx.user.create({
        data: {
          id: newUserId, name, email, password: hashedPassword,
          role: "ADMIN", clinicId: clinic.id,
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
        data: { id: newBranchId, clinicId: clinic.id, name: "Main Branch", code: "MAIN" },
      });

      // الباقة الموحدة الافتراضية
      const defaultPlan = await tx.plan.upsert({
        where: { slug: "default-plan" },
        update: {},
        create: { name: "Unified Plan", slug: "default-plan", monthlyPrice: 0, yearlyPrice: 0, active: true },
      });

      // الاشتراك المجاني (3 أيام تجربة)
      const startDate = new Date();
      const trialEnd = new Date(startDate);
      trialEnd.setDate(trialEnd.getDate() + 3);

      await tx.subscription.create({
        data: {
          clinicId: clinic.id,
          planId: defaultPlan.id,
          status: "TRIAL",
          startDate,
          trialEndsAt: trialEnd,
        },
      });

      // تحديث كود التسجيل إنه اتاستخدم
      await tx.activationCode.update({
        where: { id: codeRecord.id },
        data: { isUsed: true, usedByClinicId: clinic.id, usedAt: new Date() },
      });
    });
  } catch (error) {
    console.error("Signup Error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "An account with this email already exists" };
    }
    return { success: false, error: "Failed to create account. Please try again." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Account created. Please sign in manually." };
    }
    throw error;
  }
}

// ─── Redeem Subscription Code Action (لصفحة الـ Billing مستقبلا) ──────────

export async function redeemSubscriptionCode(clinicId: string, code: string): Promise<ActionResult> {
  const codeRecord = await prisma.activationCode.findUnique({ where: { code } });

  if (!codeRecord || codeRecord.type !== "SUBSCRIPTION" || codeRecord.isUsed) {
    return { success: false, error: "Invalid or already used subscription code." };
  }

  try {
    const subscription = await prisma.subscription.findUnique({ where: { clinicId } });
    if (!subscription) return { success: false, error: "No subscription found." };

    const now = new Date();
    // لو الاشتراك القديم لسه شغال، هنزود عليه، لو خلاص هنبدأ من النهاردة
    const startDate = subscription.endDate && subscription.endDate > now ? subscription.endDate : now;
    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() + codeRecord.durationDays);

    await prisma.$transaction([
      prisma.subscription.update({
        where: { clinicId },
        data: { 
          status: "ACTIVE", 
          endDate: newEndDate, 
          trialEndsAt: null // بنشيل الـ trial عشان التايمر يتحول للـ endDate
        },
      }),
      prisma.activationCode.update({
        where: { id: codeRecord.id },
        data: { isUsed: true, usedByClinicId: clinicId, usedAt: now },
      }),
    ]);

    return { success: true };
  } catch (error) {
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