// src/components/branch/branch-filter.tsx

"use client";

import { BranchType } from "@/types/branch";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";

interface BranchFilterProps {
  branches: BranchType[];
}

export function BranchFilter({ branches }: BranchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentBranch = searchParams.get("branchId") || "all";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("branchId");
    } else {
      params.set("branchId", value);
    }
    router.push(`?${params.toString()}`);
  }

  if (branches.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-gray-400" />
      <select
        value={currentBranch}
        onChange={(e) => handleChange(e.target.value)}
        className="text-sm border-gray-200 rounded-md"
      >
        <option value="all">All Branches</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>
  );
}