"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSelectedBranch } from "@/lib/actions/branch-context";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface BranchSwitcherProps {
  branches: Branch[];
  selectedBranchId: string | null;
}

export function BranchSwitcher({ branches, selectedBranchId }: BranchSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (branches.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
        <Building2 className="w-4 h-4" />
        <span className="truncate">{branches[0]?.name || "Main Branch"}</span>
      </div>
    );
  }

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  async function handleSelect(branchId: string) {
    await setSelectedBranch(branchId);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative px-3 mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors border border-white/5"
      >
        <Building2 className="w-4 h-4 text-teal-400" />
        <span className="truncate flex-1 text-left">
          {selectedBranch?.name || "All Branches"}
        </span>
        <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-[230px] bg-slate-800 rounded-lg shadow-xl border border-white/10 py-1 z-50">
            <button
              onClick={() => handleSelect("all")}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2 text-slate-300",
                !selectedBranchId && "text-teal-400 font-medium"
              )}
            >
              All Branches
              {!selectedBranchId && <Check className="w-4 h-4 ml-auto" />}
            </button>
            <div className="border-t border-white/5 my-1" />
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleSelect(branch.id)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2 text-slate-300",
                  selectedBranchId === branch.id && "text-teal-400 font-medium"
                )}
              >
                {branch.name}
                <span className="text-[10px] text-slate-500">{branch.code}</span>
                {selectedBranchId === branch.id && <Check className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}