// src/components/branch/branch-card.tsx

import { BranchType } from "@/types/branch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Phone, Mail, Users, CalendarDays } from "lucide-react";
import Link from "next/link";

interface BranchCardProps {
  branch: BranchType;
}

export function BranchCard({ branch }: BranchCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{branch.name}</h3>
            <p className="text-xs text-gray-500">{branch.code}</p>
          </div>
        </div>
        <Badge variant={branch.isActive ? "default" : "secondary"} className={branch.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}>
          {branch.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        {branch.city && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            {branch.city}
          </div>
        )}
        {branch.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            {branch.phone}
          </div>
        )}
        {branch.manager && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            {branch.manager.name}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 border-t pt-4 mb-4">
        <span>{branch._count?.patients || 0} Patients</span>
        <span>{branch._count?.appointments || 0} Appointments</span>
        <span>{(branch._count as any)?.doctorBranches || 0} Doctors</span>
      </div>

      <div className="flex gap-2">
        <Link href={`/settings/branches/edit/${branch.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">Edit</Button>
        </Link>
      </div>
    </div>
  );
}