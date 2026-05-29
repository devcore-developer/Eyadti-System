"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import type { LoginInput, SignupInput } from "@/lib/validations/auth";
import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { randomUUID } from "crypto";

// ─── Return Type ────────────────────────────────────────────────────────────

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Login Action ───────────────────────────────────────────────────────────

export async function loginAction(
  values: LoginInput
): Promise<ActionResult> {
  const validated = loginSchema.safeParse(values);

  if (!validated.success) {
    const firstError = validated.error.issues[0];
    return {
      success: false,
      error: firstError?.message ?? "Invalid input",
    };
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
          return {
            success: false,
            error: "Incorrect email or password. Please try again.",
          };
        case "CallbackRouteError":
          return {
            success: false,
            error: "Authentication failed. Please try again.",
          };
        default:
          return {
            success: false,
            error: "An authentication error occurred",
          };
      }
    }

    throw error;
  }
}

// ─── Signup Action ──────────────────────────────────────────────────────────

export async function signupAction(
  values: SignupInput
): Promise<ActionResult> {
  const validated = signupSchema.safeParse(values);

  if (!validated.success) {
    const firstError = validated.error.issues[0];
    return {
      success: false,
      error: firstError?.message ?? "Invalid input",
    };
  }

  const { name, email, password, clinicName, activationCode } = validated.data;

  // 1. التحقق من كود التفعيل أولاً
  const codeRecord = await prisma.activationCode.findUnique({
    where: { code: activationCode },
  });

  if (!codeRecord) {
    return { success: false, error: "Invalid activation code. Please contact the administrator." };
  }

  if (codeRecord.isUsed) {
    return { success: false, error: "This activation code has already been used." };
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

  // 3. إنشاء الحساب وتفعيل الكود في نفس الـ Transaction
  try {
    await prisma.$transaction(async (tx) => {
      const newUserId = randomUUID();
      const newClinicId = randomUUID();
      const newBranchId = randomUUID();

      // إنشاء العيادة
      const clinic = await tx.clinic.create({
        data: { id: newClinicId, name: clinicName },
      });

      // إنشاء المستخدم
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

      // ربط المالك بالعيادة
      await tx.clinic.update({
        where: { id: clinic.id },
        data: { ownerId: user.id },
      });

      // الإعدادات الافتراضية
      await tx.clinicSettings.create({
        data: { clinicId: clinic.id, clinicName },
      });

      // الفرع الرئيسي
      await tx.branch.create({
        data: {
          id: newBranchId,
          clinicId: clinic.id,
          name: "Main Branch",
          code: "MAIN",
        },
      });

      // جلب الباقة المرتبطة بالكود، أو الباقة الافتراضية
      let planId = codeRecord.planId;
      if (!planId) {
        const defaultPlan = await tx.plan.upsert({
          where: { slug: "default-plan" },
          update: {},
          create: {
            name: "Default Plan",
            slug: "default-plan",
            monthlyPrice: 0,
            yearlyPrice: 0,
            active: true,
          },
        });
        planId = defaultPlan.id;
      }

      // إنشاء الاشتراك بناءً على مدة الكود (durationDays)
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + codeRecord.durationDays);

      await tx.subscription.create({
        data: {
          clinicId: clinic.id,
          planId: planId,
          status: "ACTIVE", // بما إنه دخل كود، يبقى Active مش Trial
          startDate,
          endDate,
        },
      });

      // ✨✨ تحديث الكود إنه اتاستخدم وربطه بالعيادة ✨✨
      await tx.activationCode.update({
        where: { id: codeRecord.id },
        data: {
          isUsed: true,
          usedByClinicId: clinic.id,
          usedAt: new Date(),
        },
      });
    });
  } catch (error) {
    console.error("Signup Error:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target as string[] | undefined;
      if (target?.includes("email")) {
        return { success: false, error: "An account with this email already exists" };
      }
    }
    return { success: false, error: "Failed to create account. Please try again." };
  }

  // تسجيل الدخول التلقائي
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Account created successfully. Please sign in manually." };
    }
    throw error;
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