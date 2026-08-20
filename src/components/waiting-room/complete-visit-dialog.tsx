"use client"

import { useState, useEffect, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
// تم تغيير الـ import ليأتي من الـ backend القوي
import { completeSplitVisitWithServices } from "@/lib/actions/visits" 
import { getClinicServices, type ClinicServiceItem } from "@/lib/actions/clinic-services"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PaymentMethod } from "@prisma/client"
import {
  X,
  CreditCard,
  Plus,
  Minus,
  Trash2,
  ClipboardList,
  Loader2,
  CircleDollarSign,
  Package,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ExistingInvoice = {
  invoiceId: string
  totalAmount: number
  totalPaid: number
  remaining: number
  status: string
}

type SelectedService = {
  id: string
  name: string
  price: number
  quantity: number
  isCustom?: boolean
}

type Props = {
  visitId: string
  patientId: string
  doctorId: string
  patientName: string
  appointmentId?: string | null
  clinicId: string
  branchId?: string | null
  existingInvoice?: ExistingInvoice
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CompleteVisitDialog({
  visitId,
  patientId,
  doctorId,
  patientName,
  appointmentId,
  clinicId,
  branchId,
  existingInvoice,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open! : internalOpen
  const handleDialogChange = (value: boolean) => {
    if (onOpenChange) onOpenChange(value)
    else setInternalOpen(value)
  }

  // ── Services state ──
  const [clinicServices, setClinicServices] = useState<ClinicServiceItem[]>([])
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customPrice, setCustomPrice] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH)

  // ── Fetch clinic services when dialog opens ──
  useEffect(() => {
    if (dialogOpen) {
      setIsLoadingServices(true)
      getClinicServices(clinicId)
        .then(setClinicServices)
        .catch(() => setClinicServices([]))
        .finally(() => setIsLoadingServices(false))
    }
  }, [dialogOpen, clinicId])

  // ── Reset on close ──
  useEffect(() => {
    if (!dialogOpen) {
      setSelectedServices([])
      setShowCustomForm(false)
      setCustomName("")
      setCustomPrice("")
      setPaymentMethod(PaymentMethod.CASH)
    }
  }, [dialogOpen])

  // ── Calculations ──
  const servicesTotal = useMemo(() =>
    selectedServices.reduce((sum, s) => sum + s.price * s.quantity, 0),
    [selectedServices]
  )

  const previousTotal = existingInvoice?.totalAmount || 0
  const alreadyPaid = existingInvoice?.totalPaid || 0
  const newTotal = previousTotal + servicesTotal
  const remaining = Math.max(0, newTotal - alreadyPaid)
  const hasServices = selectedServices.length > 0

  // ── Toggle clinic service ──
  function toggleService(service: ClinicServiceItem) {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id && !s.isCustom)
      if (exists) return prev.filter(s => s.id !== service.id || s.isCustom)
      return [...prev, { id: service.id, name: service.name, price: service.price, quantity: 1 }]
    })
  }

  // ── Update quantity ──
  function updateQuantity(id: string, delta: number) {
    setSelectedServices(prev =>
      prev.map(s =>
        s.id === id ? { ...s, quantity: Math.max(1, s.quantity + delta) } : s
      )
    )
  }

  // ── Remove service ──
  function removeService(id: string) {
    setSelectedServices(prev => prev.filter(s => s.id !== id))
  }

  // ── Add custom service ──
  function addCustomService() {
    const name = customName.trim()
    const price = parseFloat(customPrice)
    if (!name || isNaN(price) || price <= 0) {
      toast.error("Enter a valid name and price")
      return
    }
    const id = `custom-${Date.now()}`
    setSelectedServices(prev => [...prev, { id, name, price, quantity: 1, isCustom: true }])
    setCustomName("")
    setCustomPrice("")
    setShowCustomForm(false)
  }

  // ── Submit ──
  function handleSubmit() {
    // لا نحتاج لمنع الإرسال إذا لم يتم اختيار خدمات، لأن المريض قد لا يحتاج خدمات إضافية
    // والـ Backend هو من سيقرر بناءً على المبلغ المتبقي الحقيقي (Zero Post-Visit Case)
    
    startTransition(async () => {
      const servicesPayload = selectedServices.map(s => ({
        name: s.name,
        price: s.price,
        quantity: s.quantity,
      }))

      const result = await completeSplitVisitWithServices({
        appointmentId: appointmentId || null,
        visitId,
        patientId,
        clinicId,
        branchId,
        doctorId,
        services: servicesPayload,
        paidAmount: remaining, // الـ Backend سيتحقق من هذا الرقم مقابل قاعدة البيانات
        paymentMethod,
      })

      if (result.success) {
        toast.success("Visit completed — payment recorded")
        handleDialogChange(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to complete visit")
      }
    })
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-[#0f1a2e] shadow-xl rounded-2xl max-h-[90vh] flex flex-col">

        {/* ━━━ Header ━━━ */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-start gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 bg-purple-100 dark:bg-purple-950/50">
              <ClipboardList className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold text-slate-900 dark:text-slate-50 leading-tight">
                Complete Visit & Record Services
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Patient: <span className="font-semibold text-slate-700 dark:text-slate-300">{patientName}</span>
              </DialogDescription>
            </div>
          </div>
          <button type="button" onClick={() => handleDialogChange(false)} className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors -mt-1 -mr-1.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ━━━ Body ━━━ */}
        <div className="px-5 pb-4 space-y-4 flex-1 overflow-y-auto min-h-0">

          {/* ── Services List ── */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Services Performed
            </p>

            {isLoadingServices ? (
              <div className="flex items-center justify-center py-6 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading services...
              </div>
            ) : clinicServices.length === 0 && selectedServices.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-xl">
                <Package className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">No services configured yet</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Add a custom service below</p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/50 overflow-hidden">
                {/* Clinic services */}
                {clinicServices.map(service => {
                  const selected = selectedServices.find(s => s.id === service.id && !s.isCustom)
                  return (
                    <label
                      key={service.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => toggleService(service)}
                        className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="flex-1 text-[13px] text-slate-800 dark:text-slate-200 truncate">
                        {service.name}
                        {service.category && (
                          <span className="text-[10px] text-slate-400 ml-1.5">({service.category})</span>
                        )}
                      </span>
                      <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300 tabular-nums w-20 text-right">
                        {service.price.toFixed(0)}
                      </span>
                      {selected && (
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); updateQuantity(service.id, -1) }}
                            className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-[12px] font-semibold tabular-nums">
                            {selected.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); updateQuantity(service.id, 1) }}
                            className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </label>
                  )
                })}

                {/* Custom services */}
                {selectedServices.filter(s => s.isCustom).map(service => (
                  <div
                    key={service.id}
                    className="flex items-center gap-3 px-3 py-2.5 bg-purple-50/50 dark:bg-purple-950/10"
                  >
                    <span className="flex-1 text-[13px] text-purple-800 dark:text-purple-200 truncate font-medium">
                      {service.name}
                    </span>
                    <span className="text-[13px] font-semibold text-purple-700 dark:text-purple-300 tabular-nums w-20 text-right">
                      {service.price.toFixed(0)}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(service.id, -1)}
                        className="h-6 w-6 rounded flex items-center justify-center text-purple-400 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-700 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-[12px] font-semibold tabular-nums">
                        {service.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(service.id, 1)}
                        className="h-6 w-6 rounded flex items-center justify-center text-purple-400 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-700 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeService(service.id)}
                      className="h-6 w-6 rounded flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Empty state when services exist but none selected */}
                {clinicServices.length > 0 && selectedServices.length === 0 && (
                  <div className="px-3 py-3 text-center text-[11px] text-slate-400">
                    Select services performed during this visit
                  </div>
                )}
              </div>
            )}

            {/* Add Custom Service */}
            {!showCustomForm ? (
              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="flex items-center gap-2 w-full mt-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Custom Service
              </button>
            ) : (
              <div className="flex items-center gap-2 mt-2 p-2 border border-purple-200 dark:border-purple-800 rounded-xl bg-purple-50/30 dark:bg-purple-950/10">
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="Service name"
                  className="flex-1 h-8 text-[12px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2"
                />
                <input
                  type="number"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)}
                  placeholder="Price"
                  min="0"
                  step="0.01"
                  className="w-24 h-8 text-[12px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 tabular-nums"
                />
                <button
                  type="button"
                  onClick={addCustomService}
                  className="h-8 px-3 rounded-lg bg-purple-600 text-white text-[11px] font-medium hover:bg-purple-700 transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCustomForm(false); setCustomName(""); setCustomPrice("") }}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* ── Payment Summary ── */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 space-y-2">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Payment Summary
            </p>

            {previousTotal > 0 && (
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500">Previous Invoice</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                  {previousTotal.toFixed(2)} EGP
                </span>
              </div>
            )}

            {hasServices && (
              <div className="flex justify-between text-[12px]">
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  + Services ({selectedServices.length})
                </span>
                <span className="font-semibold text-purple-700 dark:text-purple-300 tabular-nums">
                  {servicesTotal.toFixed(2)} EGP
                </span>
              </div>
            )}

            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-1.5">
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Total Due</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {newTotal.toFixed(2)} EGP
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-emerald-600 dark:text-emerald-400">Already Paid</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-300 tabular-nums">
                  {alreadyPaid.toFixed(2)} EGP
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5">
                <div className="flex justify-between text-[14px]">
                  <span className="font-bold text-slate-900 dark:text-slate-100">Remaining</span>
                  <span className={cn(
                    "font-bold tabular-nums",
                    remaining > 0
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {remaining.toFixed(2)} EGP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Payment Method ── */}
          {remaining > 0 && (
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Payment Method
              </p>
              <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger className="h-9 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-[12px] px-3">
                  <CreditCard className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="INSURANCE">Insurance</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Buttons ── */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleDialogChange(false)}
              disabled={isPending}
              className="flex-1 h-10 rounded-xl text-[13px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              // تم إزالة الـ disabled المعقد الذي كان يمنع الحالة الصفرية
              disabled={isPending}
              className={cn(
                "flex-1 h-10 rounded-xl text-[13px] font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5",
                remaining > 0
                  ? "bg-orange-600 text-white hover:bg-orange-700 shadow-sm active:scale-[0.98]"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm active:scale-[0.98]"
              )}
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CircleDollarSign className="h-3.5 w-3.5" />
              )}
              {remaining > 0
                ? `Pay ${remaining.toFixed(0)} EGP & Complete`
                : "Complete Visit"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}