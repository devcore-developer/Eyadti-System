// src/app/(dashboard)/admin/plans/page.tsx

import { getAllPlans } from "@/lib/services/subscription";
import { PlanTable } from "@/components/admin/plan-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Plan Management | Eyadti Admin",
};

export default async function AdminPlansPage() {
  const plans = await getAllPlans();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan Management</h1>
          <p className="text-gray-500 mt-1">
            Create and manage subscription plans
          </p>
        </div>
        <Link href="/admin/plans/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Plan
          </Button>
        </Link>
      </div>

      <PlanTable plans={plans} />
    </div>
  );
}