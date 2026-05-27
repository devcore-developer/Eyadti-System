// src/components/admin/plan-table.tsx

"use client";

import { PlanWithUsage } from "@/types/subscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No plans found. Create your first plan.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan</TableHead>
            <TableHead>Monthly</TableHead>
            <TableHead>Yearly</TableHead>
            <TableHead>Limits</TableHead>
            <TableHead>Features</TableHead>
            <TableHead>Subscriptions</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell>
                <div>
                  <p className="font-semibold text-gray-900">{plan.name}</p>
                  <p className="text-xs text-gray-400">{plan.slug}</p>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                ${Number(plan.monthlyPrice).toFixed(2)}
              </TableCell>
              <TableCell className="font-medium">
                ${Number(plan.yearlyPrice).toFixed(2)}
              </TableCell>
              <TableCell>
                <div className="text-xs space-y-0.5">
                  <p>
                    {plan.maxDoctors ?? "∞"} Doctors ·{" "}
                    {plan.maxUsers ?? "∞"} Users
                  </p>
                  <p>
                    {plan.maxPatients ?? "∞"} Patients ·{" "}
                    {plan.maxBranches ?? "∞"} Branches
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {plan.onlineBookingEnabled && (
                    <Badge variant="secondary" className="text-xs">
                      Booking
                    </Badge>
                  )}
                  {plan.analyticsEnabled && (
                    <Badge variant="secondary" className="text-xs">
                      Analytics
                    </Badge>
                  )}
                  {plan.notificationsEnabled && (
                    <Badge variant="secondary" className="text-xs">
                      Notifications
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {plan.subscriptionCount}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    plan.active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  )}
                >
                  {plan.active ? "Active" : "Archived"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/admin/plans/edit/${plan.id}`}>
                    <Button variant="ghost" size="sm">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchive(plan.id, !plan.active)}
                    disabled={loadingId === plan.id}
                  >
                    {plan.active ? (
                      <Archive className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ArchiveRestore className="w-4 h-4 text-emerald-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(plan.id)}
                    disabled={loadingId === plan.id}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}