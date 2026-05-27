// src/components/branch/branch-selector.tsx
"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2 } from "lucide-react"
import { getBranches } from "@/lib/actions/branches"
import { useEffect, useState } from "react"

interface BranchSelectorProps {
  value?: string
  onValueChange?: (value: string | null, eventDetails?: any) => void // تم تعديل هذا السطر
  placeholder?: string
  disabled?: boolean
}

export function BranchSelector({
  value,
  onValueChange,
  placeholder = "Select Branch",
  disabled = false,
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBranches() {
      try {
        const data = await getBranches() // تأكد إن هذا الـ action بيجيب الفروع النشطة فقط
        setBranches(data || [])
      } catch (error) {
        console.error("Failed to load branches", error)
      } finally {
        setLoading(false)
      }
    }
    loadBranches()
  }, [])

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          <SelectValue placeholder={loading ? "Loading branches..." : placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {branches.length === 0 && !loading ? (
          <div className="p-4 text-center text-sm text-slate-500">
            No active branches found
          </div>
        ) : (
          branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-teal-400" />
                <span>{branch.name}</span>
                <span className="text-xs text-slate-500">({branch.code})</span>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}