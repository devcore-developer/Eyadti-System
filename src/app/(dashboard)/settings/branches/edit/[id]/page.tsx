// src/app/(dashboard)/settings/branches/edit/[id]/page.tsx

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { BranchForm } from "@/components/branch/branch-form";

export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) redirect("/dashboard");
  
  const { id } = await params;

  const branch = await prisma.branch.findFirst({
    where: { id, clinicId: session.user.clinicId },
  });

  if (!branch) notFound();

  return (
    <div className="space-y-6 animate-fade">
      <div>
        <h1 className="text-page-title text-foreground">Edit Branch</h1>
        <p className="text-body text-muted-foreground mt-1">
          Update the details for <span className="font-semibold text-foreground">{branch.name}</span> branch.
        </p>
      </div>

      {/* Premium Form Container */}
      <div className="premium-card p-6 md:p-8">
        <BranchForm branch={branch} mode="edit" />
      </div>
    </div>
  );
}