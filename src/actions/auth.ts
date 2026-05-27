// src/actions/auth.ts
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
            error: "Invalid email or password",
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

  const { name, email, password, clinicName } = validated.data;

  // Pre-check for existing email (provides friendly error message)
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return {
      success: false,
      error: "An account with this email already exists",
    };
  }

  const hashedPassword = await hashPassword(password);

  // Create clinic + admin user + settings + default branch atomically
  try {
    await prisma.$transaction(async (tx) => {
      const newUserId = randomUUID();
      const newClinicId = randomUUID();
      const newBranchId = randomUUID();

      // 1. إنشاء العيادة أولاً (ownerId أصبح اختيارياً في الـ Schema)
      const clinic = await tx.clinic.create({
        data: {
          id: newClinicId,
          name: clinicName,
        },
      });

      // 2. إنشاء المستخدم وربطه بالعيادة
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

      // 3. تحديث العيادة وربطها بالمستخدم كمالك
      await tx.clinic.update({
        where: { id: clinic.id },
        data: {
          ownerId: user.id,
        },
      });

      // 4. إنشاء إعدادات العيادة الافتراضية (يحل مشكلة الـ FK Error على Vercel)
      await tx.clinicSettings.create({
        data: {
          clinicId: clinic.id,
          clinicName: clinicName,
        },
      });

      // 5. إنشاء الفرع الرئيسي الافتراضي (يحل مشكلة فشل إنشاء مريض لاحقاً)
      await tx.branch.create({
        data: {
          id: newBranchId,
          clinicId: clinic.id,
          name: "Main Branch",
          code: "MAIN",
        },
      });
    });
  } catch (error) {
    console.error("Signup Error:", error);

    // Handle race condition on unique email constraint
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target as string[] | undefined;
      if (target?.includes("email")) {
        return {
          success: false,
          error: "An account with this email already exists",
        };
      }
    }

    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }

  // Auto sign-in after successful signup
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "Account created successfully. Please sign in manually.",
      };
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