"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  ShieldCheck, 
  MoreHorizontal,
  Building2,
  Users
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { impersonateClinic } from "@/lib/actions/super-admin"

interface Clinic {
  id: string
  name: string
  owner: { name: string } | null
  subscription: { status: string; endDate: Date | null; plan: { name: string } | null } | null
  _count: { users: number; branches: number; patients: number; appointments: number }
  createdAt: Date
}

const ITEMS_PER_PAGE = 8

export function ClinicsManagementClient({ initialClinics }: { initialClinics: Clinic[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const filteredClinics = useMemo(() => {
    return initialClinics.filter((clinic) => {
      const matchesSearch = clinic.name.toLowerCase().includes(search.toLowerCase()) || 
                            clinic.owner?.name.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "ALL" || clinic.subscription?.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [initialClinics, search, statusFilter])

  const totalPages = Math.ceil(filteredClinics.length / ITEMS_PER_PAGE)
  const paginatedClinics = filteredClinics.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleImpersonate = async (clinicId: string) => {
    setLoadingAction(clinicId);
    const result = await impersonateClinic(clinicId);
    setLoadingAction(null);
    if (result.success) alert("✅ Entering Support Mode...");
    else alert("❌ Failed: " + result.error);
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-6">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clinics or owners..."
              className="pl-10 bg-background"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            />
          </div>
          <div className="flex gap-2">
            {["ALL", "ACTIVE", "TRIAL", "EXPIRED"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => { setStatusFilter(status); setCurrentPage(1) }}
                className="text-xs"
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="relative w-full overflow-auto rounded-lg border border-border/50">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/30">
              <tr>
                <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">Clinic</th>
                <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Plan</th>
                <th className="h-11 px-4 text-center align-middle font-medium text-muted-foreground hidden lg:table-cell">Branches</th>
                <th className="h-11 px-4 text-center align-middle font-medium text-muted-foreground">Patients</th>
                <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground hidden xl:table-cell">Joined</th>
                <th className="h-11 px-4 text-right align-middle font-medium text-muted-foreground w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedClinics.length > 0 ? paginatedClinics.map((clinic) => (
                <tr key={clinic.id} className="border-b transition-colors hover:bg-muted/30 group">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-md h-9 w-9 flex items-center justify-center border border-border/50">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">{clinic.name}</p>
                        <p className="text-xs text-muted-foreground">{clinic.owner?.name || 'No Owner'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle text-muted-foreground text-xs hidden md:table-cell">
                    {clinic.subscription?.plan?.name || 'None'}
                  </td>
                  <td className="p-4 align-middle text-center hidden lg:table-cell">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Building2 className="h-3 w-3" /> {clinic._count.branches}
                    </div>
                  </td>
                  <td className="p-4 align-middle text-center font-medium">
                    {clinic._count.patients}
                  </td>
                  <td className="p-4 align-middle">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "capitalize text-xs font-normal",
                        clinic.subscription?.status === 'ACTIVE' && "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
                        clinic.subscription?.status === 'TRIAL' && "border-blue-500/30 text-blue-600 bg-blue-500/10",
                        clinic.subscription?.status === 'EXPIRED' && "border-rose-500/30 text-rose-600 bg-rose-500/10"
                      )}
                    >
                      {clinic.subscription?.status || 'INACTIVE'}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle text-xs text-muted-foreground hidden xl:table-cell">
                    {new Date(clinic.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 align-middle text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-accent transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => router.push(`/super-admin/clinics/${clinic.id}`)} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleImpersonate(clinic.id)} 
                          className="text-amber-600 cursor-pointer focus:text-amber-600"
                          disabled={loadingAction === clinic.id}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          {loadingAction === clinic.id ? "Switching..." : "Support Mode"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="h-32 text-center text-muted-foreground">
                    No clinics found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredClinics.length)} of {filteredClinics.length} results
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}