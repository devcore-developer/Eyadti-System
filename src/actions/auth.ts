// src/actions/auth.ts
"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import type { LoginInput, SignupInput } from "@/lib/validations/auth";
import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { randomUUID } from "crypto"; // ← تمت إضافة هذا الاستيراد لتوليد الـ IDs

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
    const firstError = validated.error.issues[0]; // ← تم تعديلها لـ issues بدلاً من errors لـ Zod v4
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

    // This line is unreachable — signIn throws NEXT_REDIRECT on success.
    // It exists only to satisfy the return type.
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

    // Re-throw non-auth errors (e.g. NEXT_REDIRECT from Next.js)
    throw error;
  }
}

// ─── Signup Action ──────────────────────────────────────────────────────────

export async function signupAction(
  values: SignupInput
): Promise<ActionResult> {
  const validated = signupSchema.safeParse(values);

  if (!validated.success) {
    const firstError = validated.error.issues[0]; // ← تم تعديلها لـ issues بدلاً من errors لـ Zod v4
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

  // Create clinic + admin user atomically
  try {
    await prisma.$transaction(async (tx) => {
      const newUserId = randomUUID();
      const newClinicId = randomUUID();

      // 1. إنشاء العيادة أولاً "بدون مالك" (تأكد أن ownerId في Schema هو String? اختياري)
      const clinic = await tx.clinic.create({
        data: {
          id: newClinicId,
          name: clinicName,
          // ownerId سيتم إضافته في الخطوة الثالثة
        },
      });

      // 2. إنشاء المستخدم وربطه بالعيادة التي تم إنشاؤها للتو
      const user = await tx.user.create({
        data: {
          id: newUserId,
          name,
          email,
          password: hashedPassword,
          role: "ADMIN",
          clinicId: clinic.id, // ← العيادة موجودة بالفعل، لن يحدث خطأ
        },
      });

      // 3. تحديث العيادة وربطها بالمستخدم كمالك
      await tx.clinic.update({
        where: { id: clinic.id },
        data: {
          ownerId: user.id, // ← المستخدم موجود بالفعل، لن يحدث خطأ
        },
      });
    });
  } catch (error) {
    // ⚠️ إضافة هذا السطر مهم جداً لمعرفة الخطأ الحقيقي في Vercel Logs
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
    // Re-throw NEXT_REDIRECT and other non-auth errors
    throw error;
  }
}