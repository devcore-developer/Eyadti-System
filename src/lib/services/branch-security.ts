// src/lib/services/branch-security.ts

import { prisma } from "@/lib/db";

/**
 * Check if a user has access to a specific branch
 */
export async function hasBranchAccess(
  userId: string,
  branchId: string,
  userRole: string,
  clinicId: string
): Promise<boolean> {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;

  if (userRole === "DOCTOR") {
    const assignment = await prisma.doctorBranch.findFirst({
      where: { doctorId: userId, branchId },
    });
    return !!assignment;
  }

  const userBranch = await prisma.userBranch.findFirst({
    where: { userId, branchId },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { allBranchAccess: true },
  });

  return user?.allBranchAccess || !!userBranch;
}

/**
 * Get list of branch IDs a user can access
 */
export async function getUserAccessibleBranches(
  userId: string,
  userRole: string,
  clinicId: string
): Promise<string[]> {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
    const branches = await prisma.branch.findMany({
      where: { clinicId, isActive: true },
      select: { id: true },
    });
    return branches.map((b) => b.id);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { allBranchAccess: true },
  });

  if (user?.allBranchAccess) {
    const branches = await prisma.branch.findMany({
      where: { clinicId, isActive: true },
      select: { id: true },
    });
    return branches.map((b) => b.id);
  }

  if (userRole === "DOCTOR") {
    const assignments = await prisma.doctorBranch.findMany({
      where: { doctorId: userId, branch: { isActive: true } },
      select: { branchId: true },
    });
    return assignments.map((a) => a.branchId);
  }

  const userBranches = await prisma.userBranch.findMany({
    where: { userId, branch: { isActive: true } },
    select: { branchId: true },
  });
  return userBranches.map((ub) => ub.branchId);
}