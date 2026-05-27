// src/components/booking/branch-step.tsx
"use client"

import { Building2, MapPin, Phone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getBranches } from "@/lib/actions/branches"
import { useEffect, useState } from "react"

interface BranchStepProps {
  onSelect: (branchId: string) => void
}

export function BranchStep({ onSelect }: BranchStepProps) {
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBranches() {
      const res = await getBranches()
      setBranches(res?.filter((b: any) => b.isActive) || [])
      setLoading(false)
    }
    fetchBranches()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-slate-800 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">1. Select a Branch</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((branch) => (
          <Card
            key={branch.id}
            className="bg-slate-900/50 border border-white/5 hover:border-teal-500/50 cursor-pointer transition-all duration-200"
            onClick={() => onSelect(branch.id)}
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-medium">
                  <Building2 className="h-5 w-5 text-teal-400" />
                  {branch.name}
                </div>
                <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">
                  {branch.code}
                </Badge>
              </div>
              <div className="space-y-1.5 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  {branch.city}, {branch.address}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  {branch.phone}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}