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
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-teal-600" />
          {mode === "create" ? "Create New Branch" : "Edit Branch"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Branch Name <span className="text-red-500">*</span></Label>
              <Input 
                name="name" 
                defaultValue={branch?.name || ""} 
                required 
                placeholder="e.g. Alexandria Branch"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Branch Code <span className="text-red-500">*</span></Label>
              <Input 
                name="code" 
                defaultValue={branch?.code || ""} 
                required 
                placeholder="e.g. ALEX"
                className="uppercase"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input 
              name="address" 
              defaultValue={branch?.address || ""} 
              placeholder="Street, Building..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input 
                name="city" 
                defaultValue={branch?.city || ""} 
                placeholder="e.g. Alexandria"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input 
                name="phone" 
                defaultValue={branch?.phone || ""} 
                placeholder="e.g. 01278280555"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input 
              name="email" 
              type="email" 
              defaultValue={branch?.email || ""} 
              placeholder="branch@clinic.com"
            />
          </div>

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
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}