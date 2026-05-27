// src/app/(dashboard)/settings/branches/new/page.tsx

import { BranchForm } from "@/components/branch/branch-form";

export default function NewBranchPage() {
  return (
    <div className="p-6">
      <BranchForm mode="create" />
    </div>
  );
}