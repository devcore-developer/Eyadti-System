import { prisma } from "@/lib/db";

/**
 * Check and update expired trials and active subscriptions.
 * Called on every JWT token generation and session update.
 */
export async function checkAndExpireTrials(clinicId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { clinicId },
  });

  if (!subscription) return false;

  // Expire trials that have ended
  if (
    subscription.status === "TRIAL" &&
    subscription.trialEndsAt &&
    new Date() > subscription.trialEndsAt
  ) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "EXPIRED" },
    });
    return true;
  }

  // Expire ACTIVE subscriptions that have passed their end date
  if (
    subscription.status === "ACTIVE" &&
    subscription.endDate &&
    new Date() > subscription.endDate
  ) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "EXPIRED" },
    });
    return true;
  }

  return false;
}