// src/app/(dashboard)/admin/plans/edit/[id]/page.tsx

import { getPlanById } from "@/lib/services/subscription";
import { PlanForm } from "@/components/admin/plan-form";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Plan | Nexora Admin",
};

export default async function EditPlanPage({
  params,
}: {
  // ✨ الحل: تغيير النوع لـ Promise زي ما Next.js 16 طلب
  params: Promise<{ id: string }>;
}) {
  // ✨ فك الـ Promise بـ await
  const { id } = await params;
  
  const plan = await getPlanById(id);

  if (!plan) {
    notFound();
  }

  return (
    // ✨ تطبيق الـ Premium Layout المتوافق مع باقي النظام
    <div className="max-w-4xl mx-auto animate-fade-in-up pb-20 md:pb-0">
      <PlanForm plan={plan} mode="edit" />
    </div>
  );
}