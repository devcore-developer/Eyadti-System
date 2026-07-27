"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, ChevronLeft, ChevronRight, Eye, ShieldCheck, MoreHorizontal,
  Building2, Ban, CheckCircle2, Archive
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { impersonateClinic, suspendClinic, activateClinic, archiveClinic } from "@/lib/actions/super-admin"
import { differenceInDays } from "date-fns"

interface Clinic {
  id: string
  name: string
  owner: { name: string } | null
  subscription: { status: string; endDate: Date | null; plan: { name: string } | null } | null
  _count: { users: number; branches: number; patients: number; appointments: number }
  createdAt: Date
}

const ITEMS_PER_PAGE = 10

export function ClinicsManagementClient({ initialClinics }: { initialClinics: Clinic[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const filteredClinics = useMemo(() => {
    return initialClinics.filter((clinic) => {
      const matchesSearch = clinic.name.toLowerCase().includes(search.toLowerCase()) || 
                            clinic.owner?.name?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "ALL" || clinic.subscription?.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [initialClinics, search, statusFilter])

  const totalPages = Math.ceil(filteredClinics.length / ITEMS_PER_PAGE)
  const paginatedClinics = filteredClinics.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleAction = async (action: () => Promise<any>, clinicId: string) => {
    setLoadingAction(clinicId)
    const result = await action()
    setLoadingAction(null)
    // لو هي impersonate، يروح للداشبورد عشان يشوف واجهة العيادة
    if (result?.success && action.name === "impersonateClinic") {
      router.push("/dashboard") // <--- غيرها من '/super-admin' لـ '/dashboard'
    } else if (result?.success) {
      router.refresh()
    } else {
      alert(result?.error || "Action failed")
    }
  }

  const getDaysRemaining = (endDate: Date | null | undefined) => {
    if (!endDate) return null
    return differenceInDays(new Date(endDate), new Date())
  }

  return (
    <Card className="premium-card border-none">
      <CardContent className="p-6">
        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clinics or owners..."
              className="pl-10 bg-background h-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex bg-muted/50 p-1 rounded-lg border">
              {["ALL", "ACTIVE", "TRIAL", "EXPIRED", "SUSPENDED", "CANCELLED"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "ghost"}
                  size="sm"
                  onClick={() => { setStatusFilter(status); setCurrentPage(1) }}
                  className="text-xs h-8 rounded-md"
                >
                  {status === "ALL" ? "All Status" : status.charAt(0) + status.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="relative w-full overflow-auto rounded-xl border border-border/50">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/30">
              <tr>
                <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Clinic</th>
                <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Subscription</th>
                <th className="h-11 px-4 text-center align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Days Left</th>
                <th className="h-11 px-4 text-center align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Patients</th>
                <th className="h-11 px-4 text-right align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedClinics.length > 0 ? paginatedClinics.map((clinic) => {
                const daysLeft = getDaysRemaining(clinic.subscription?.endDate)
                const subStatus = clinic.subscription?.status || "INACTIVE"
                return (
                  <tr key={clinic.id} className={cn(
                    "border-b transition-colors hover:bg-muted/20 group",
                    subStatus === "SUSPENDED" && "bg-red-500/5 opacity-75",
                    subStatus === "CANCELLED" && "bg-muted/40 opacity-60"
                  )}>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg h-9 w-9 flex items-center justify-center border border-border/50">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground group-hover:text-[#6B9CFF] transition-colors">{clinic.name}</p>
                          <p className="text-xs text-muted-foreground">{clinic.owner?.name || 'No Owner'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">{clinic.subscription?.plan?.name || 'No Plan'}</span>
                        <Badge variant="outline" className={cn(
                          "capitalize text-[10px] w-fit font-normal",
                          subStatus === 'ACTIVE' && "border-[#6BCB77]/30 text-[#6BCB77] bg-[#6BCB77]/10",
                          subStatus === 'TRIAL' && "border-[#6B9CFF]/30 text-[#6B9CFF] bg-[#6B9CFF]/10",
                          subStatus === 'EXPIRED' && "border-[#EF6B6B]/30 text-[#EF6B6B] bg-[#EF6B6B]/10",
                          subStatus === 'SUSPENDED' && "border-[#EF6B6B]/30 text-[#EF6B6B] bg-[#EF6B6B]/10",
                          subStatus === 'CANCELLED' && "border-gray-400/30 text-gray-500 bg-gray-500/10"
                        )}>
                          {subStatus}
                        </Badge>
                      </div>
                    </td>

                    <td className="p-4 align-middle text-center hidden md:table-cell">
                      {clinic.subscription?.endDate ? (
                        <span className={cn(
                          "text-xs font-bold",
                          daysLeft !== null && daysLeft <= 5 && daysLeft > 0 && "text-[#F4B860]",
                          (daysLeft === null || daysLeft < 0) ? "text-[#EF6B6B]" : "text-muted-foreground"
                        )}>
                          {daysLeft !== null && daysLeft > 0 ? daysLeft + " days" : "Expired"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </td>

                    <td className="p-4 align-middle text-center font-medium text-sm">
                      {clinic._count.patients}
                    </td>

                    <td className="p-4 align-middle text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => router.push("/super-admin/clinics/" + clinic.id)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleAction(() => impersonateClinic(clinic.id), clinic.id)} 
                            className="text-[#F4B860] cursor-pointer focus:text-[#F4B860]"
                            disabled={loadingAction === clinic.id}
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            {loadingAction === clinic.id ? "Switching..." : "Support Mode"}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {subStatus === "ACTIVE" || subStatus === "TRIAL" || subStatus === "EXPIRED" ? (
                            <DropdownMenuItem 
                              onClick={() => handleAction(() => suspendClinic(clinic.id, "Manual suspension"), clinic.id)} 
                              className="text-[#EF6B6B] cursor-pointer focus:text-[#EF6B6B]"
                              disabled={loadingAction === clinic.id}
                            >
                              <Ban className="mr-2 h-4 w-4" /> Suspend Clinic
                            </DropdownMenuItem>
                          ) : subStatus === "SUSPENDED" ? (
                            <DropdownMenuItem 
                              onClick={() => handleAction(() => activateClinic(clinic.id), clinic.id)} 
                              className="text-[#6BCB77] cursor-pointer focus:text-[#6BCB77]"
                              disabled={loadingAction === clinic.id}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Activate Clinic
                            </DropdownMenuItem>
                          ) : null}
                          
                          {subStatus !== "CANCELLED" && (
                            <DropdownMenuItem 
                              onClick={() => handleAction(() => archiveClinic(clinic.id), clinic.id)} 
                              className="cursor-pointer"
                              disabled={loadingAction === clinic.id}
                            >
                              <Archive className="mr-2 h-4 w-4" /> Archive Clinic
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={5} className="h-32 text-center text-muted-foreground">
                    No clinics found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredClinics.length)} of {filteredClinics.length}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button key={page} variant={currentPage === page ? "default" : "ghost"} size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(page)}>
                  {page}
                </Button>
              ))}
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}