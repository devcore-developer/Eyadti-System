"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Ban, CheckCircle2, Archive, Trash2, RefreshCw, CalendarClock, AlertTriangle 
} from "lucide-react"
import { renewSubscription, suspendClinic, activateClinic, archiveClinic, permanentDeleteClinic } from "@/lib/actions/super-admin"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { format, addDays } from "date-fns"

interface Props {
  clinicId: string
  clinicName: string
  currentSubStatus: string
  planName: string
  endDate: Date | null | undefined
  daysLeft: number | null
}

export function ClinicLifecycleActions({ clinicId, clinicName, currentSubStatus, planName, endDate, daysLeft }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [renewDays, setRenewDays] = useState<number>(30)
  const [deleteInput, setDeleteInput] = useState("")
  const [suspendReason, setSuspendReason] = useState("")
  
  const [isRenewOpen, setIsRenewOpen] = useState(false)
  const [isSuspendOpen, setIsSuspendOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleAction = async (action: () => Promise<any>, dialogSetter?: (v: boolean) => void) => {
    setLoading(action.name)
    const res = await action()
    setLoading(null)
    if (res?.success) {
      dialogSetter?.(false)
      router.refresh()
    } else {
      alert(res?.error || "Action failed")
    }
  }

  const previewRenewDate = () => {
    const base = endDate && new Date(endDate) > new Date() ? new Date(endDate) : new Date()
    return format(addDays(base, renewDays), "MMM d, yyyy")
  }

  const isActiveStatus = currentSubStatus === "ACTIVE" || currentSubStatus === "TRIAL" || currentSubStatus === "EXPIRED"
  const isSuspendedStatus = currentSubStatus === "SUSPENDED"
  const isArchivedStatus = currentSubStatus === "CANCELLED"

  return (
    <div className="space-y-6">
      {/* Status Summary Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          <Badge variant="outline" className={cn(
            "font-bold",
            isActiveStatus && "border-[#6BCB77]/30 text-[#6BCB77] bg-[#6BCB77]/10",
            isSuspendedStatus && "border-[#EF6B6B]/30 text-[#EF6B6B] bg-[#EF6B6B]/10",
            isArchivedStatus && "border-gray-400/30 text-gray-500 bg-gray-500/10"
          )}>
            {currentSubStatus}
          </Badge>
        </div>
        {daysLeft !== null && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <span className={cn("text-sm font-bold", daysLeft <= 5 ? "text-[#F4B860]" : "text-foreground")}>{daysLeft} Days Left</span>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Renew */}
        <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-[#6BCB77]/30 hover:bg-[#6BCB77]/10 hover:text-[#6BCB77] transition-all">
              <RefreshCw className="h-5 w-5" />
              <span className="text-xs font-semibold">Renew Sub</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Renew Subscription</DialogTitle>
              <DialogDescription>Add time to {clinicName}&apos;s subscription.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 gap-2">
                {[30, 90, 180, 365].map(d => (
                  <Button key={d} variant={renewDays === d ? "default" : "outline"} className="text-xs h-10" onClick={() => setRenewDays(d)}>
                    +{d} D
                  </Button>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-[#6BCB77]/5 border border-[#6BCB77]/20">
                <p className="text-xs text-muted-foreground">New Expiration Date</p>
                <p className="text-lg font-extrabold text-[#6BCB77]">{previewRenewDate()}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsRenewOpen(false)}>Cancel</Button>
              <Button className="bg-[#6BCB77] hover:bg-[#6BCB77]/90 text-white" disabled={loading === "renew"} onClick={() => handleAction(() => renewSubscription(clinicId, renewDays), setIsRenewOpen)}>
                {loading === "renew" ? "Processing..." : "Confirm Renewal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend / Activate */}
        {isActiveStatus ? (
          <Dialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-[#EF6B6B]/30 hover:bg-[#EF6B6B]/10 hover:text-[#EF6B6B] transition-all">
                <Ban className="h-5 w-5" />
                <span className="text-xs font-semibold">Suspend</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#EF6B6B]">Suspend Clinic</DialogTitle>
                <DialogDescription>This will immediately lock out all users from {clinicName}.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <label className="text-sm font-medium text-muted-foreground">Reason (Optional)</label>
                <Input className="mt-2" value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="e.g., Payment fraud detected" />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsSuspendOpen(false)}>Cancel</Button>
                <Button variant="destructive" disabled={loading === "suspend"} onClick={() => handleAction(() => suspendClinic(clinicId, suspendReason), setIsSuspendOpen)}>
                  {loading === "suspend" ? "Suspending..." : "Yes, Suspend"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : isSuspendedStatus ? (
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-[#6BCB77]/30 hover:bg-[#6BCB77]/10 hover:text-[#6BCB77] transition-all" disabled={loading === "activate"} onClick={() => handleAction(() => activateClinic(clinicId))}>
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-xs font-semibold">{loading === "activate" ? "Activating..." : "Activate"}</span>
          </Button>
        ) : <div />}

        {/* Archive */}
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-gray-400/30 hover:bg-gray-500/10 hover:text-gray-600 transition-all" disabled={isArchivedStatus || loading === "archive"} onClick={() => handleAction(() => archiveClinic(clinicId))}>
          <Archive className="h-5 w-5" />
          <span className="text-xs font-semibold">{loading === "archive" ? "Archiving..." : "Archive"}</span>
        </Button>

        {/* Permanent Delete — إصلاح: يطلب اسم العيادة بدلاً من "DELETE" */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-[#EF6B6B]/30 hover:bg-[#EF6B6B]/10 hover:text-[#EF6B6B] transition-all">
              <Trash2 className="h-5 w-5" />
              <span className="text-xs font-semibold">Delete</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg border-[#EF6B6B]/30">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#EF6B6B]">
                <AlertTriangle className="h-5 w-5" /> Permanent Deletion
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete {clinicName}, its users, branches, patients, and all medical records.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 p-4 rounded-xl bg-[#EF6B6B]/5 border border-[#EF6B6B]/20 space-y-2 text-sm text-muted-foreground">
              <p>• Patients: <span className="text-foreground font-medium">Will be deleted</span></p>
              <p>• Medical Records: <span className="text-foreground font-medium">Will be deleted</span></p>
              <p>• Invoices & Payments: <span className="text-foreground font-medium">Will be deleted</span></p>
              <p>• Audit Logs: <span className="text-foreground font-medium">Will be deleted</span></p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Type the clinic name <span className="font-bold text-[#EF6B6B]">{clinicName}</span> to confirm:
              </label>
              <Input 
                value={deleteInput} 
                onChange={e => setDeleteInput(e.target.value)} 
                placeholder={clinicName} 
                className="border-[#EF6B6B]/30 focus-visible:ring-[#EF6B6B]" 
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setIsDeleteOpen(false); setDeleteInput("") }}>Cancel</Button>
              <Button 
                variant="destructive" 
                disabled={deleteInput.toLowerCase() !== clinicName.toLowerCase() || loading === "delete"} 
                onClick={() => handleAction(() => permanentDeleteClinic(clinicId, deleteInput), setIsDeleteOpen)}
              >
                {loading === "delete" ? "Deleting..." : "Permanently Delete Clinic"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}