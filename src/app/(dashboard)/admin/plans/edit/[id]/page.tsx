// src/app/(dashboard)/admin/plans/edit/[id]/page.tsx

import { getPlanById } from "@/lib/services/subscription";
import { PlanForm } from "@/components/admin/plan-form";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Plan | Eyadti Admin",
};

export default async function EditPlanPage({
  params,
}: {
  params: { id: string };
}) {
  const plan = await getPlanById(params.id);

  if (!plan) {
    notFound();
  }

  return (
    <div className="p-6">
      <PlanForm plan={plan} mode="edit" />
    </div>
  );
}