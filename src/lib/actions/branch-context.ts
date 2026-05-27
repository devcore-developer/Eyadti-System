"use server";

import { cookies } from "next/headers";

export async function setSelectedBranch(branchId: string) {
  const cookieStore = await cookies();
  cookieStore.set("selectedBranchId", branchId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export async function getSelectedBranch(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("selectedBranchId")?.value || null;
}