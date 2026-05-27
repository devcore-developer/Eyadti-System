// src/lib/services/audit.ts

import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { AuditAction, EntityType } from "@/types/audit";

interface AuditLogParams {
  clinicId: string;
  userId?: string | null;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  oldValues?: any;
  newValues?: any;
}

export async function auditLog({
  clinicId,
  userId,
  action,
  entityType,
  entityId,
  oldValues = null,
  newValues = null,
}: AuditLogParams) {
  try {
    const headersList = await headers(); // ← أضفنا await
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      null;
    const userAgent = headersList.get("user-agent") || null;

    await prisma.auditLog.create({
      data: {
        clinicId,
        userId: userId || null,
        action,
        entityType,
        entityId,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw error to avoid breaking the main operation
  }
}