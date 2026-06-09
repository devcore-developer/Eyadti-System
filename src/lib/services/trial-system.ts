// src/lib/services/trial-system.ts
import { prisma } from "@/lib/db";
import { PLANS_CONFIG } from "@/lib/constants/features";

/**
 * Initialize a 14-day free trial for a newly registered clinic.
 * Should be called immediately after Clinic creation.
 */
export async function initializeTrialSubscription(clinicId: string) {
  // 1. Find or Create the STARTER plan
  let starterPlan = await prisma.plan.findUnique({
    where: { slug: "starter" },
  });

  if (!starterPlan) {
    console.log("Seeding Starter plan for the first time...");
    starterPlan = await prisma.plan.create({
      data: PLANS_CONFIG.STARTER,
    });
  }

  // 2. Calculate trial dates
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

  // 3. Create the subscription record with TRIAL status
  const subscription = await prisma.subscription.create({
    data: {
      clinicId,
      planId: starterPlan.id,
      status: "TRIAL",
      startDate: now,
      trialEndsAt: trialEndsAt,
      currentPeriodEnd: trialEndsAt, // تنتهي الفترة الحالية مع انتهاء التجربة
    },
  });

  return subscription;
}

/**
 * Check and update expired trials
 */
export async function checkAndExpireTrials(clinicId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { clinicId },
  });

  if (subscription?.status === "TRIAL" && subscription.trialEndsAt && new Date() > subscription.trialEndsAt) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "EXPIRED" },
    });
    return true; // Expired just now
  }
  return false;
}