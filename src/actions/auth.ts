"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import type { LoginInput, SignupInput } from "@/lib/validations/auth";
import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { randomUUID } from "crypto";
import { PLANS_CONFIG, TRIAL_DURATION_DAYS } from "@/lib/constants/features";

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
    });
    
    return { success: true }; 
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
        default:
          return { success: false, error: "حدث خطأ في المصادقة" };
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

  // 1. الكود بقى إجباري تماماً
  if (!signupCode || signupCode.trim() === "") {
    return { success: false, error: "Signup code is required to create an account." };
  }

  // 2. التحقق من الكود (سواء كان SIGNUP أو SUBSCRIPTION)
  const codeRecord = await prisma.activationCode.findUnique({
    where: { code: signupCode.trim() },
    include: { plan: true } // ← عشان نعرف الباقة والمدة اللي الكود مديها
  });

  if (!codeRecord) {
    return { success: false, error: "Invalid signup code. Please contact the administrator." };
  }

  if (codeRecord.isUsed) {
    return { success: false, error: "This code has already been used." };
  }

  // 3. التأكد إن الإيميل مش مسجل
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { success: false, error: "An account with this email already exists" };
  }

  const hashedPassword = await hashPassword(password);

  // 4. إنشاء الحساب وتفعيل الاشتراك بناءً على الكود
  try {
    await prisma.$transaction(async (tx) => {
      const newUserId = randomUUID();
      const newClinicId = randomUUID();
      const newBranchId = randomUUID();

      const clinic = await tx.clinic.create({
        data: { id: newClinicId, name: clinicName, slug: `clinic-${newClinicId.substring(0, 8)}` },
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

      // ── تفعيل الاشتراك بناءً على بيانات الكود ──
      const planId = codeRecord.planId;
      const durationDays = codeRecord.durationDays;

      if (!planId) {
        throw new Error("This code is not linked to a plan. Contact admin.");
      }

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      
      // لو المدة 10 أيام أو أقل، يبقى حساب تجريبي (TRIAL)، غير كده (ACTIVE)
      const status = durationDays <= 10 ? "TRIAL" : "ACTIVE";

      await tx.subscription.create({
        data: {
          clinicId: clinic.id,
          planId: planId,
          status: status,
          startDate: startDate,
          trialEndsAt: status === "TRIAL" ? endDate : null,
          currentPeriodEnd: endDate,
          endDate: endDate,          
        },
      });

      // تحديث الكود إنه اتاستخدم
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

// ─── Redeem Subscription Code Action ──────────

export async function redeemSubscriptionCode(clinicId: string, code: string): Promise<ActionResult> {
  const codeRecord = await prisma.activationCode.findUnique({ 
    where: { code },
    include: { plan: true } // نجيب بيانات الباقة المربوطة بالكود
  });

  if (!codeRecord || codeRecord.type !== "SUBSCRIPTION" || codeRecord.isUsed) {
    return { success: false, error: "Invalid or already used subscription code." };
  }

  try {
    const subscription = await prisma.subscription.findUnique({ where: { clinicId } });
    if (!subscription) return { success: false, error: "No subscription found." };

    const now = new Date();
    
    // لو الاشتراك لسه شغال، هنزود عليه، لو خلاص هنبدأ من النهاردة
    const startDate = subscription.currentPeriodEnd && subscription.currentPeriodEnd > now ? subscription.currentPeriodEnd : now;
    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() + codeRecord.durationDays);

    // تحديد الباقة الجديدة: لو الكود مربوط لباقة معينة نستخدمها، لو لا نستخدم الباقة الحالية
    const newPlanId = codeRecord.planId || subscription.planId;

    await prisma.$transaction([
      prisma.subscription.update({
        where: { clinicId },
        data: { 
          status: "ACTIVE", 
          planId: newPlanId, // ← تحديث الباقة بناءً على الكود
          currentPeriodEnd: newEndDate, 
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