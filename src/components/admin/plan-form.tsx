// src/components/admin/plan-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlanType } from "@/types/subscription";
import { createPlan, updatePlan } from "@/lib/actions/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PlanFormProps {
  plan?: PlanType;
  mode: "create" | "edit";
}

export function PlanForm({ plan, mode }: PlanFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const data: Record<string, unknown> = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      monthlyPrice: parseFloat(formData.get("monthlyPrice") as string) || 0,
      yearlyPrice: parseFloat(formData.get("yearlyPrice") as string) || 0,
      maxDoctors: formData.get("maxDoctors")
        ? parseInt(formData.get("maxDoctors") as string)
        : null,
      maxUsers: formData.get("maxUsers")
        ? parseInt(formData.get("maxUsers") as string)
        : null,
      maxPatients: formData.get("maxPatients")
        ? parseInt(formData.get("maxPatients") as string)
        : null,
      maxBranches: formData.get("maxBranches")
        ? parseInt(formData.get("maxBranches") as string)
        : null,
      onlineBookingEnabled: formData.get("onlineBookingEnabled") === "on",
      analyticsEnabled: formData.get("analyticsEnabled") === "on",
      notificationsEnabled: formData.get("notificationsEnabled") === "on",
      active: formData.get("active") === "on",
    };

    let result;

    if (mode === "edit" && plan) {
      result = await updatePlan({ ...data, id: plan.id });
    } else {
      result = await createPlan(data);
    }

    setLoading(false);

    if (result.success) {
      router.push("/admin/plans");
      router.refresh();
    } else {
      setError(result.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/plans">
          <Button type="button" variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "create" ? "Create New Plan" : "Edit Plan"}
          </h1>
          <p className="text-gray-500 mt-0.5">
            {mode === "create"
              ? "Define a new subscription plan"
              : `Editing ${plan?.name}`}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={plan?.name || ""}
                placeholder="e.g. Professional"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={plan?.slug || ""}
                placeholder="e.g. professional"
                required
                disabled={mode === "edit"}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={plan?.description || ""}
              placeholder="Brief description of the plan"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyPrice">Monthly Price ($)</Label>
              <Input
                id="monthlyPrice"
                name="monthlyPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={plan?.monthlyPrice ?? 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearlyPrice">Yearly Price ($)</Label>
              <Input
                id="yearlyPrice"
                name="yearlyPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={plan?.yearlyPrice ?? 0}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Resource Limits
            <span className="text-gray-400 font-normal ml-2">
              Leave empty for unlimited
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxDoctors">Max Doctors</Label>
              <Input
                id="maxDoctors"
                name="maxDoctors"
                type="number"
                min="1"
                placeholder="Unlimited"
                defaultValue={plan?.maxDoctors ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUsers">Max Users</Label>
              <Input
                id="maxUsers"
                name="maxUsers"
                type="number"
                min="1"
                placeholder="Unlimited"
                defaultValue={plan?.maxUsers ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPatients">Max Patients</Label>
              <Input
                id="maxPatients"
                name="maxPatients"
                type="number"
                min="1"
                placeholder="Unlimited"
                defaultValue={plan?.maxPatients ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxBranches">Max Branches</Label>
              <Input
                id="maxBranches"
                name="maxBranches"
                type="number"
                min="1"
                placeholder="Unlimited"
                defaultValue={plan?.maxBranches ?? ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Online Booking</p>
              <p className="text-xs text-gray-500">
                Patient self-booking portal
              </p>
            </div>
            <Switch
              name="onlineBookingEnabled"
              defaultChecked={plan?.onlineBookingEnabled ?? false}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Advanced Analytics</p>
              <p className="text-xs text-gray-500">
                Revenue & performance dashboards
              </p>
            </div>
            <Switch
              name="analyticsEnabled"
              defaultChecked={plan?.analyticsEnabled ?? false}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Notifications & Reminders</p>
              <p className="text-xs text-gray-500">
                In-app, SMS, WhatsApp notifications
              </p>
            </div>
            <Switch
              name="notificationsEnabled"
              defaultChecked={plan?.notificationsEnabled ?? false}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Active</p>
              <p className="text-xs text-gray-500">
                Available for new subscriptions
              </p>
            </div>
            <Switch
              name="active"
              defaultChecked={plan?.active ?? true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {mode === "create" ? "Create Plan" : "Save Changes"}
        </Button>
        <Link href="/admin/plans">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}