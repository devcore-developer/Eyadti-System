// src/app/(dashboard)/settings/branches/page.tsx

import { getBranches } from "@/lib/actions/branches";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BranchCard } from "@/components/branch/branch-card";

export default async function BranchesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const branches = await getBranches();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branches</h1>
          <p className="text-gray-500">Manage your clinic branches</p>
        </div>
        <Link href="/settings/branches/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Branch
          </Button>
        </Link>
      </div>

      {branches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <p className="text-gray-500">No branches found. Create your first branch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} />
          ))}
        </div>
      )}
    </div>
  );
}