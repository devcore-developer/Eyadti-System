// src/components/branch/branch-form.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BranchType } from "@/types/branch";
import { createBranch, updateBranch } from "@/lib/actions/branches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Loader2, AlertCircle } from "lucide-react";

interface BranchFormProps {
  branch?: BranchType;
  mode: "create" | "edit";
}

export function BranchForm({ branch, mode }: BranchFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = mode === "create"
      ? await createBranch(formData)
      : await updateBranch(branch!.id, formData);

    if (result.success) {
      router.push("/settings/branches");
      router.refresh();
    } else {
      setError(result.error || "Failed to save branch");
    }
    setLoading(false);
  }

  return (
    <Card className="max-w-2xl border-white/10 bg-white/[0.02]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-teal-400" />
          {mode === "create" ? "Create New Branch" : "Edit Branch"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Branch Name <span className="text-red-400">*</span></Label>
              <Input 
                name="name" 
                defaultValue={branch?.name || ""} 
                required 
                placeholder="e.g. Alexandria Branch"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Branch Code <span className="text-red-400">*</span></Label>
              <Input 
                name="code" 
                defaultValue={branch?.code || ""} 
                required 
                placeholder="e.g. ALEX"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 uppercase"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300">Address</Label>
            <Input 
              name="address" 
              defaultValue={branch?.address || ""} 
              placeholder="Street, Building..."
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300">City</Label>
              <Input 
                name="city" 
                defaultValue={branch?.city || ""} 
                placeholder="e.g. Alexandria"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Phone</Label>
              <Input 
                name="phone" 
                defaultValue={branch?.phone || ""} 
                placeholder="e.g. 01278280555"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300">Email</Label>
            <Input 
              name="email" 
              type="email" 
              defaultValue={branch?.email || ""} 
              placeholder="branch@clinic.com"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
            />
          </div>

          {/* Hidden input to ensure managerId is sent as empty string if not selected */}
          <input type="hidden" name="managerId" value="" />

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Branch" : "Update Branch"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              className="border-white/10 text-slate-400 hover:bg-white/5"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}