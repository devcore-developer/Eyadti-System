"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, MoreHorizontal, Eye } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SupportModeTrigger } from "./support-mode-trigger"

interface Clinic {
  id: string
  name: string
  subscription: { status: string; planName?: string } | null
  _count: { users: number; branches: number; patients: number }
  createdAt: Date
}

interface ClinicTableProps {
  initialData: Clinic[]
}

export function ClinicTable({ initialData }: ClinicTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [clinics, setClinics] = useState(initialData)

  const filteredClinics = clinics.filter((clinic) =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clinics..."
            className="pl-8 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Clinic Name</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Users</TableHead>
              <TableHead className="text-center">Patients</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClinics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No clinics found.
                </TableCell>
              </TableRow>
            ) : (
              filteredClinics.map((clinic) => (
                <TableRow key={clinic.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{clinic.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ID: {clinic.id.slice(0, 8)}...
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{clinic.subscription?.planName || "Standard"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={clinic.subscription?.status === "ACTIVE" ? "default" : "secondary"}
                      className={
                        clinic.subscription?.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                          : ""
                      }
                    >
                      {clinic.subscription?.status || "INACTIVE"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium">{clinic._count.users}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium">{clinic._count.patients}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      {/* ✅ Fixed: Styled Trigger Directly */}
                      <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem onClick={() => router.push(`/super-admin/clinics/${clinic.id}`)} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer p-0">
                          <div className="w-full px-2 py-1.5">
                            <SupportModeTrigger clinicId={clinic.id} clinicName={clinic.name} />
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}