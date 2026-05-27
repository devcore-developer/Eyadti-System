// src/app/(dashboard)/admin/plans/new/page.tsx

import { PlanForm } from "@/components/admin/plan-form";

export const metadata = {
  title: "Create Plan | Eyadti Admin",
};

export default function NewPlanPage() {
  return (
    <div className="p-6">
      <PlanForm mode="create" />
    </div>
  );
}