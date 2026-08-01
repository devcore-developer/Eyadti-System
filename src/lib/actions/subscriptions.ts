"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createSubscriptionSchema,
  cancelSubscriptionSchema,
} from "@/lib/validations/subscription";
import { ActionResult } from "@/types";
import {
  activateSubscription,
  cancelSubscription,
  getSubscription,
  reactivateSubscription,
} from "@/lib/services/subscription";
import { checkUsageLimit } from "@/lib/services/usage-limits";
import { auditLog } from "@/lib/services/audit";

export async function subscribeToPlan(
  formData: unknown
): Promise<ActionResult> {
  try {
    const session = await auth();
    // FIX #42: Remove dead OWNER role check
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Only admins can manage subscriptions." };
    }

    const validated = createSubscriptionSchema.parse(formData);

    const newPlan = await prisma.plan.findUnique({
      where: { id: validated.planId },
    });
    if (!newPlan || !newPlan.active) {
      return { success: false, error: "Selected plan is not available." };
    }

    const currentSub = await getSubscription(validated.clinicId);

    let action: "CREATE" | "UPGRADE" | "DOWNGRADE" = "CREATE";
    let oldPlanName = "Free";

    if (currentSub) {
      const oldPlan = await prisma.plan.findUnique({ where: { id: currentSub.planId } });
      oldPlanName = oldPlan?.name || "Unknown";

      if (newPlan.monthlyPrice > (oldPlan?.monthlyPrice || 0)) {
        action = "UPGRADE";
      } else if (newPlan.monthlyPrice < (oldPlan?.monthlyPrice || 0)) {
        action = "DOWNGRADE";
      } else {
        action = "UPGRADE";
      }

      // FIX #43: Add MONTHLY_VISITS to downgrade check
      const resources: Array<"DOCTORS" | "USERS" | "PATIENTS" | "BRANCHES" | "MONTHLY_VISITS"> = [
        "DOCTORS", "USERS", "PATIENTS", "BRANCHES", "MONTHLY_VISITS",
      ];

      for (const resource of resources) {
        const usage = await checkUsageLimit(validated.clinicId, resource);
        const newLimit = resource === "DOCTORS" ? newPlan.maxDoctors :
                         resource === "USERS" ? newPlan.maxUsers :
                         resource === "PATIENTS" ? newPlan.maxPatients :
                         resource === "BRANCHES" ? newPlan.maxBranches :
                         newPlan.maxMonthlyVisits;

        if (newLimit !== null && newLimit !== -1 && usage.current > newLimit) {
          return {
            success: false,
            error: `Current ${resource.toLowerCase()} usage (${usage.current}) exceeds the new plan limit (${newLimit}). Please reduce before downgrading.`,
          };
        }
      }
    }

    const subscription = await activateSubscription(
      validated.clinicId,
      validated.planId,
      validated.billingCycle
    );

    await auditLog({
      clinicId: validated.clinicId,
      userId: session.user.id,
      action: action,
      entityType: "SUBSCRIPTION",
      entityId: subscription.id,
      oldValues: currentSub ? { planId: currentSub.planId, planName: oldPlanName } : null,
      newValues: { planId: newPlan.id, planName: newPlan.name, billingCycle: validated.billingCycle },
    });

    revalidatePath("/settings/billing");
    revalidatePath("/settings/subscriptions");
    revalidatePath("/dashboard");
    return { success: true, error: undefined };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to subscribe." };
  }
}

export async function cancelMySubscription(
  formData: unknown
): Promise<ActionResult> {
  try {
    const session = await auth();
    // FIX #42: Remove dead OWNER role check
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Only admins can cancel subscriptions." };
    }

    const validated = cancelSubscriptionSchema.parse(formData);

    const sub = await prisma.subscription.findUnique({
      where: { id: validated.subscriptionId },
    });

    if (!sub) {
      return { success: false, error: "Subscription not found." };
    }

    await cancelSubscription(validated.subscriptionId);

    await auditLog({
      clinicId: session.user.clinicId,
      userId: session.user.id,
      action: "CANCEL",
      entityType: "SUBSCRIPTION",
      entityId: validated.subscriptionId,
      oldValues: { status: sub.status },
      newValues: { status: "CANCELLED" },
    });

    revalidatePath("/settings/billing");
    revalidatePath("/settings/subscriptions");
    revalidatePath("/dashboard");
    return { success: true, error: undefined };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to cancel subscription.",
    };
  }
}

export async function reactivateMySubscription(
  subscriptionId: string,
  planId: string,
  billingCycle: "MONTHLY" | "YEARLY"
): Promise<ActionResult> {
  try {
    const session = await auth();
    // FIX #42: Remove dead OWNER role check
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Only admins can manage subscriptions." };
    }

    await reactivateSubscription(subscriptionId, planId, billingCycle);

    await auditLog({
      clinicId: session.user.clinicId,
      userId: session.user.id,
      action: "UPDATE",
      entityType: "SUBSCRIPTION",
      entityId: subscriptionId,
      newValues: { status: "ACTIVE", planId, billingCycle },
    });

    revalidatePath("/settings/billing");
    revalidatePath("/settings/subscriptions");
    revalidatePath("/dashboard");
    return { success: true, error: undefined };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to reactivate subscription.",
    };
  }
}