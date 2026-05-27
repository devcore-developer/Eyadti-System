"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { createPatient, updatePatient } from "@/lib/actions/patients"
import type { ActionResult } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type PatientData = {
  id?: string
  fullName: string
  phone: string
  email?: string | null
  gender?: string | null
  dateOfBirth?: Date | null
  address?: string | null
}

type Props = {
  patient?: PatientData
}

function toDateString(date: Date | null | undefined): string {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

export function PatientForm({ patient }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const isEdit = !!patient?.id

  function handleResult(result: ActionResult) {
    if (!result.success) {
      setError(result.error || "Something went wrong")
      setFieldErrors(result.fieldErrors || {})
      toast.error(result.error || "Something went wrong") // إشعار الخطأ
    } else {
      toast.success(isEdit ? "Patient updated successfully" : "Patient created successfully") // إشعار النجاح
      router.push("/patients")
      router.refresh()
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      if (isEdit && patient?.id) {
        const result = await updatePatient(patient.id, formData)
        handleResult(result)
      } else {
        const result = await createPatient(formData)
        handleResult(result)
      }
    })
  }

  function fieldError(name: string): string | undefined {
    return fieldErrors[name]?.[0]
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="John Doe"
            defaultValue={patient?.fullName ?? ""}
            required
          />
          {fieldError("fullName") && (
            <p className="text-xs text-red-600">{fieldError("fullName")}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="01xxxxxxxxx"
            defaultValue={patient?.phone ?? ""}
            required
          />
          {fieldError("phone") && (
            <p className="text-xs text-red-600">{fieldError("phone")}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="john@example.com"
            defaultValue={patient?.email ?? ""}
          />
          {fieldError("email") && (
            <p className="text-xs text-red-600">{fieldError("email")}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">
            Date of Birth <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue={toDateString(patient?.dateOfBirth)}
            required
          />
          {fieldError("dateOfBirth") && (
            <p className="text-xs text-red-600">{fieldError("dateOfBirth")}</p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">
            Gender <span className="text-red-500">*</span>
          </Label>
          {/* Using native select for FormData compatibility, styled like Shadcn */}
          <select
            id="gender"
            name="gender"
            defaultValue={patient?.gender ?? ""}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select...</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          {fieldError("gender") && (
            <p className="text-xs text-red-600">{fieldError("gender")}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          name="address"
          rows={3}
          placeholder="123 Main St, City, Country"
          defaultValue={patient?.address ?? ""}
        />
        {fieldError("address") && (
          <p className="text-xs text-red-600">{fieldError("address")}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : isEdit ? "Update Patient" : "Create Patient"}
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
  )
}