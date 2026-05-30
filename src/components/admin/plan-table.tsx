"use client";

import { PlanWithUsage } from "@/types/subscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileCard, MobileCardItem } from "@/components/ui/mobile-card";
import { archivePlan, deletePlan } from "@/lib/actions/plans";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanTableProps {
  plans: PlanWithUsage[];
}

export function PlanTable({ plans }: PlanTableProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleArchive(id: string, active: boolean) {
    setLoadingId(id);
    await archivePlan({ id, active });
    setLoadingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    setLoadingId(id);
    await deletePlan(id);
    setLoadingId(null);
    router.refresh();
  }

  if (plans.length === 0) {
    return <div className="text-center py-16 text-gray-500">No plans found. Create your first plan.</div>;
  }

  return (
    <div className="space-y-4">
      
      {/* ━━━ DESKTOP TABLE ━━━ */}
      <div className="hidden md:block rounded-xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1D2A3B] overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 dark:bg-[#223247]/50 border-b border-[rgba(148,163,184,0.1)]">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Pricing</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Limits</th>
              <th className="text-center p-4 font-medium text-muted-foreground">Status</th>
              <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
            {plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-slate-50/50 dark:hover:bg-[#223247]/30 transition-colors">
                <td className="p-4">
                  <p className="font-semibold text-foreground">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">{plan.slug}</p>
                </td>
                <td className="p-4 align-top">
                  <p className="font-medium">${Number(plan.monthlyPrice).toFixed(2)}<span className="text-muted-foreground font-normal">/mo</span></p>
                  <p className="text-xs text-muted-foreground">${Number(plan.yearlyPrice).toFixed(2)}/yr</p>
                </td>
                <td className="p-4 align-top text-xs text-muted-foreground">
                  <p>{plan.maxDoctors ?? "∞"} Docs · {plan.maxUsers ?? "∞"} Users</p>
                  <p>{plan.maxPatients ?? "∞"} Patients · {plan.maxBranches ?? "∞"} Branches</p>
                </td>
                <td className="p-4 text-center">
                  <Badge variant="outline" className={cn("text-xs", plan.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200")}>
                    {plan.active ? "Active" : "Archived"}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/plans/edit/${plan.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="w-4 h-4" /></Button></Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleArchive(plan.id, !plan.active)} disabled={loadingId === plan.id}>
                      {plan.active ? <Archive className="w-4 h-4 text-gray-400" /> : <ArchiveRestore className="w-4 h-4 text-emerald-500" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(plan.id)} disabled={loadingId === plan.id}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ━━━ MOBILE CARDS ━━━ */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {plans.map((plan) => (
          <MobileCard key={plan.id}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-sm">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.slug}</p>
              </div>
              <Badge variant="outline" className={cn("text-[10px]", plan.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200")}>
                {plan.active ? "Active" : "Archived"}
              </Badge>
            </div>
            <MobileCardItem label="Monthly" value={`$${Number(plan.monthlyPrice).toFixed(2)}`} />
            <MobileCardItem label="Limits" value={`${plan.maxDoctors ?? "∞"} Docs, ${plan.maxPatients ?? "∞"} Patients`} />
            
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
              <Link href={`/admin/plans/edit/${plan.id}`} className="text-xs font-medium text-primary">Edit</Link>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleArchive(plan.id, !plan.active)} disabled={loadingId === plan.id}>
                  {plan.active ? <Archive className="w-3 h-3" /> : <ArchiveRestore className="w-3 h-3 text-emerald-500" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(plan.id)} disabled={loadingId === plan.id}>
                  <Trash2 className="w-3 h-3 text-red-400" />
                </Button>
              </div>
            </div>
          </MobileCard>
        ))}
      </div>
    </div>
  );
}