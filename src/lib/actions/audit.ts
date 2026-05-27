// src/lib/actions/audit.ts

"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { AuditLogFilters, AuditLogPagination, AuditLogEntry } from "@/types/audit";

/**
 * Get audit logs with filters and pagination
 */
export async function getAuditLogs(filters: AuditLogFilters) {
  const session = await auth();
  if (!session?.user?.clinicId || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const {
    search = "",
    action = "",
    entityType = "",
    userId = "",
    dateFrom = "",
    dateTo = "",
    page = 1,
    perPage = 20,
  } = filters;

  const where: any = {
    clinicId: session.user.clinicId,
  };

  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (userId) where.userId = userId;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  if (search) {
    where.OR = [
      { entityId: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const pagination: AuditLogPagination = {
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };

  return { logs: logs as AuditLogEntry[], pagination };
}

/**
 * Get activity timeline for a specific entity
 */
export async function getEntityTimeline(
  entityType: string,
  entityId: string
) {
  const session = await auth();
  if (!session?.user?.clinicId) return [];

  return prisma.auditLog.findMany({
    where: {
      clinicId: session.user.clinicId,
      entityType,
      entityId,
    },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

/**
 * Get users for filter dropdown
 */
export async function getAuditUsers() {
  const session = await auth();
  if (!session?.user?.clinicId || session.user.role !== "ADMIN") return [];

  return prisma.user.findMany({
    where: { clinicId: session.user.clinicId },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}