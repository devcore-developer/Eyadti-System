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

  if (!signupCode || signupCode.trim() === "") {
    return { success: false, error: "Signup code is required to create an account." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { success: false, error: "An account with this email already exists" };
  }

  const hashedPassword = await hashPassword(password);

  // ═══════════════════════════════════════════════════════════════
  // 🚀 BYPASS MODE: إنشاء سوبر أدمن وتخطي الـ Activation Code
  // ═══════════════════════════════════════════════════════════════
  const SUPER_ADMIN_BYPASS_CODE = "DEV-SUPER-ADMIN";

  if (signupCode.trim() === SUPER_ADMIN_BYPASS_CODE) {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. إنشاء الباقات الأساسية لو الداتابيز نضيفة (مطابقة للـ Schema)
        const defaultPlans = [
          {
            id: "free",
            name: "Free",
            slug: "free",
            description: "Basic plan for single doctors",
            monthlyPrice: 0,
            yearlyPrice: 0,
            maxDoctors: 1,
            maxUsers: 2,
            maxPatients: 500,
            maxBranches: 1,
            maxMonthlyVisits: 100,
            onlineBookingEnabled: false,
            analyticsEnabled: false,
            whatsappEnabled: false,
            auditLogsEnabled: false,
            galleryEnabled: false,
            advancedInvoicesEnabled: false,
            doctorSchedulesEnabled: false,
            queueManagementEnabled: false,
            waitingRoomDisplayEnabled: false,
            active: true,
          },
          {
            id: "pro",
            name: "Professional",
            slug: "pro",
            description: "For growing clinics",
            monthlyPrice: 29,
            yearlyPrice: 290,
            maxDoctors: 5,
            maxUsers: 10,
            maxPatients: 5000,
            maxBranches: 2,
            maxMonthlyVisits: 1000,
            onlineBookingEnabled: true,
            analyticsEnabled: true,
            whatsappEnabled: true,
            auditLogsEnabled: false,
            galleryEnabled: true,
            advancedInvoicesEnabled: true,
            doctorSchedulesEnabled: true,
            queueManagementEnabled: true,
            waitingRoomDisplayEnabled: false,
            active: true,
          },
          {
            id: "enterprise",
            name: "Enterprise",
            slug: "enterprise",
            description: "For large clinics and hospitals",
            monthlyPrice: 99,
            yearlyPrice: 990,
            maxDoctors: 999,
            maxUsers: 999,
            maxPatients: 99999,
            maxBranches: 10,
            maxMonthlyVisits: 9999,
            onlineBookingEnabled: true,
            analyticsEnabled: true,
            whatsappEnabled: true,
            auditLogsEnabled: true,
            galleryEnabled: true,
            advancedInvoicesEnabled: true,
            doctorSchedulesEnabled: true,
            queueManagementEnabled: true,
            waitingRoomDisplayEnabled: true,
            active: true,
          }
        ];

        for (const plan of defaultPlans) {
          await tx.plan.upsert({
            where: { id: plan.id },
            update: {},
            create: plan,
          });
        }

        // 2. إنشاء العيادة والمستخدم
        const newUserId = randomUUID();
        const newClinicId = randomUUID();
        const newBranchId = randomUUID();

        const clinic = await tx.clinic.create({
          data: { id: newClinicId, name: clinicName, slug: `clinic-${newClinicId.substring(0, 8)}` },
        });

        // 3. إنشاء اليوزر كـ SUPER_ADMIN
        const user = await tx.user.create({
          data: {
            id: newUserId, name, email, password: hashedPassword,
            role: "SUPER_ADMIN", clinicId: clinic.id,
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

        // 4. تفعيل اشتراك بخطة PRO لمدة سنة كاملة
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // سنة
        
        await tx.subscription.create({
          data: {
            clinicId: clinic.id,
            planId: "pro", // بنستخدم الـ planId اللي انشأناه فوق
            status: "ACTIVE",
            startDate: startDate,
            currentPeriodEnd: endDate,
            endDate: endDate,          
          },
        });
      });
    } catch (error) {
      console.error("Super Admin Signup Error:", error);
      return { success: false, error: "Failed to create Super Admin account." };
    }

  } else {
    // ═══════════════════════════════════════════════════════════════
    // 🏥 NORMAL MODE: التسجيل العادي بالكود
    // ═══════════════════════════════════════════════════════════════
    const codeRecord = await prisma.activationCode.findUnique({
      where: { code: signupCode.trim() },
      include: { plan: true }
    });

    if (!codeRecord) {
      return { success: false, error: "Invalid signup code. Please contact the administrator." };
    }

    if (codeRecord.isUsed) {
      return { success: false, error: "This code has already been used." };
    }

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

        const planId = codeRecord.planId;
        const durationDays = codeRecord.durationDays;

        if (!planId) {
          throw new Error("This code is not linked to a plan. Contact admin.");
        }

        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
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
  }

  // تسجيل الدخول بعد التسجيل
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

// ─── Redeem Subscription Code Action ──────────

export async function redeemSubscriptionCode(clinicId: string, code: string): Promise<ActionResult> {
  const codeRecord = await prisma.activationCode.findUnique({ 
    where: { code },
    include: { plan: true }
  });

  if (!codeRecord || codeRecord.type !== "SUBSCRIPTION" || codeRecord.isUsed) {
    return { success: false, error: "Invalid or already used subscription code." };
  }

  try {
    const subscription = await prisma.subscription.findUnique({ where: { clinicId } });
    if (!subscription) return { success: false, error: "No subscription found." };

    const now = new Date();
    const startDate = subscription.currentPeriodEnd && subscription.currentPeriodEnd > now ? subscription.currentPeriodEnd : now;
    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() + codeRecord.durationDays);

    const newPlanId = codeRecord.planId || subscription.planId;

    await prisma.$transaction([
      prisma.subscription.update({
        where: { clinicId },
        data: { 
          status: "ACTIVE", 
          planId: newPlanId,
          currentPeriodEnd: newEndDate, 
          endDate: newEndDate,
          trialEndsAt: null
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