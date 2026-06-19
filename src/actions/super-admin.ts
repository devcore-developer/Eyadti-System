"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ActionResult } from "@/types";
import { randomBytes } from "crypto";

// ─── Helper ────────────────────────────────────────────────────────
function generateRandomCode(length: number = 8): string {
  return randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length)
    .toUpperCase();
}

// ─── PLATFORM STATS ─────────────────────────────────────────────────
export async function getPlatformStats() {
  try {
    console.log("🔴 STEP 1: Function Started");

    const session = await auth();
    console.log("🔴 STEP 2: Session Retrieved", session?.user?.role);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      console.log("🔴 ❌ STOPPED: Not Super Admin");
      // بدل ما نرجع null وتختفي البيانات، هنرجع بيانات وهمية عشان نعرف الصفحة شغالة
      return {
        totalClinics: 0,
        activeClinics: 0,
        totalUsers: 0,
        totalDoctors: 0,
        totalPatients: 0,
        appointmentsToday: 0,
        mrr: 0,
        activeTrials: 0,
        expiringSubs: 0,
        failedPayments: 0
      };
    }

    console.log("🔴 STEP 3: Auth Passed. Preparing DB Queries");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    console.log("🔴 STEP 4: Executing Promise.all...");

    const [
      totalClinics,
      activeClinics,
      totalUsers,
      totalDoctors,
      totalPatients,
      appointmentsToday,
      totalRevenue,
      activeTrials,
      expiringSubs,
      failedPayments
    ] = await Promise.all([
      prisma.clinic.count(),
      prisma.clinic.count({ where: { subscription: { status: "ACTIVE" } } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "DOCTOR" } }),
      prisma.patient.count(),
      0, // appointmentsToday (commented out previously)
      
      prisma.invoice.aggregate({ 
        where: { status: "PAID" }, 
        _sum: { amount: true } 
      }),
      prisma.clinic.count({ where: { subscription: { status: "TRIAL" } } }),
      prisma.clinic.count({ 
        where: { 
          subscription: { 
            endDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, 
            status: "ACTIVE" 
          } 
        } 
      }),
      prisma.invoice.count({ where: { status: { not: "PAID" } } })
    ]);

    console.log("🔴 STEP 5: All Queries Successful!");

    return {
      totalClinics,
      activeClinics,
      totalUsers,
      totalDoctors,
      totalPatients,
      appointmentsToday,
      mrr: (totalRevenue._sum.amount as any)?.toNumber?.() || 0,
      activeTrials,
      expiringSubs,
      failedPayments
    };
  } catch (error) {
    console.error("💥 CRASH IN STATS FUNCTION:", error); // دي أهم حاجة
    return null;
  }
}

// ─── CLINICS MANAGEMENT ─────────────────────────────────────────────
export async function getAllClinics() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized");
    }
    return await prisma.clinic.findMany({
      include: {
        subscription: true,
        _count: {
          select: { users: true, branches: true, patients: true } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Error fetching clinics:", error);
    return [];
  }
}

export async function getClinicDetails(clinicId: string) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized");
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        subscription: true, 
        branches: { select: { id: true, name: true, city: true } },
        users: { select: { id: true, name: true, email: true, role: true } },
        _count: {
          select: {
            patients: true,
            appointments: true,
            invoices: true,
            users: true 
          }
        }
      }
    });

    if (!clinic) throw new Error("Clinic not found");

    const recentInvoices = await prisma.invoice.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return { ...clinic, recentInvoices };
  } catch (error) {
    console.error("Error fetching clinic details:", error);
    return null;
  }
}

export async function impersonateClinic(clinicId: string) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized");
    }

    await prisma.auditLog.create({
      data: {
        action: "SUPPORT_MODE_LOGIN",
        userId: session.user.id,
        clinicId: clinicId,
        entityType: "CLINIC",
        entityId: clinicId
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to enter support mode" };
  }
}

// ─── BILLING & REVENUE ─────────────────────────────────────────────
export async function getPlatformBillingData() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized");
    }

    const activeSubs = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true }
    });
    
    const mrr = activeSubs.reduce((sum, sub) => {
      return sum + (sub.plan?.monthlyPrice ? Number(sub.plan.monthlyPrice) : 0);
    }, 0);

    const failedPayments = await prisma.invoice.findMany({
      where: { status: { not: "PAID" } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { clinic: { select: { name: true } } }
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await prisma.invoice.groupBy({
      by: ['createdAt'],
      where: {
        status: 'PAID',
        createdAt: { gte: sixMonthsAgo }
      },
      _sum: { amount: true }
    });

    return { mrr, failedPayments, monthlyRevenue };
  } catch (error) {
    return null;
  }
}

// ─── GENERATE CODES ─────────────────────────────────────────────────
export async function superAdminGenerateCodes({ 
  planId, 
  durationDays, 
  quantity 
}: { 
  planId: string; 
  durationDays: number; 
  quantity: number; 
}): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    const codesToCreate = Array.from({ length: quantity }).map(() => ({
      code: generateRandomCode(8),
      planId: planId,
      durationDays: durationDays,
    }));

    await prisma.activationCode.createMany({
      data: codesToCreate
    });

    // ✅ استخراج الأكواد المنشئة عشان نرجعها للفرونت إند
    const generatedCodes = codesToCreate.map(c => c.code);

    return { success: true, codes: generatedCodes, message: `${quantity} codes generated for ${plan.name}` };
  } catch (error: any) {
    console.error("Error generating codes:", error);
    return { success: false, error: "Failed to generate codes" };
  }
}

// ─── FEATURES & SETTINGS ───────────────────────────────────────────
export async function toggleFeatureFlag(clinicId: string, feature: string, value: boolean) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized");
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update feature flag" };
  }
}

export async function getAllClinicsWithFlags() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") return [];

    const clinics = await prisma.clinic.findMany({
      select: { id: true, name: true, subscription: { select: { status: true } } },
      orderBy: { name: 'asc' }
    });
    
    return clinics.map(c => ({
      ...c,
      features: {
        whatsappEnabled: true,
        onlineBookingEnabled: c.subscription?.status === 'ACTIVE',
        smsNotifications: false
      }
    }));
  } catch (error) {
    return [];
  }
}
export async function getAllPlans() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized");
    }

    return await prisma.plan.findMany({
      where: { active: true }, // بنجيب الخطط الفعالة بس
      orderBy: { monthlyPrice: 'asc' }
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return [];
  }
}