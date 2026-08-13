"use client"

import { useState } from "react"
import { TrendingUp, DollarSign, AlertCircle, Activity, Users, FileText } from "lucide-react"
import { formatCurrency } from "@/lib/utils/date-filters"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface OutstandingPatient {
  patientId: string
  patientName: string
  patientPhone: string
  totalDue: number
  invoiceCount: number
  lastPaymentDate: string | null
}

interface InvoiceKPIsProps {
  monthlyRevenue: number
  totalRevenue: number
  outstandingBalance: number
  collectionRate: number
  outstandingInvoiceCount?: number
  outstandingPatients?: OutstandingPatient[]
}

export function InvoiceKPIs({
  monthlyRevenue,
  totalRevenue,
  outstandingBalance,
  collectionRate,
  outstandingInvoiceCount = 0,
  outstandingPatients = [],
}: InvoiceKPIsProps) {
  const [outstandingOpen, setOutstandingOpen] = useState(false)

  const kpiData = [
    {
      title: "Monthly Revenue",
      value: formatCurrency(monthlyRevenue),
      icon: TrendingUp,
      accent: "text-[#6B9CFF]",
      iconBg: "bg-[#6B9CFF]/10",
      interactive: false,
    },
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      accent: "text-[#5BC0BE]",
      iconBg: "bg-[#5BC0BE]/10",
      interactive: false,
    },
    {
      title: "Outstanding",
      value: formatCurrency(outstandingBalance),
      icon: AlertCircle,
      accent: "text-[#F4B860]",
      iconBg: "bg-[#F4B860]/10",
      interactive: outstandingBalance > 0,
      onClick: () => setOutstandingOpen(true),
    },
    {
      title: "Collection Rate",
      value: `${collectionRate}%`,
      icon: Activity,
      accent: "text-[#89D6D2]",
      iconBg: "bg-[#89D6D2]/10",
      interactive: false,
    },
  ]

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <div
              key={index}
              className={`p-4 md:p-6 rounded-2xl md:rounded-[24px] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:from-[#223247] dark:to-[#1D2A3B] dark:bg-gradient-to-br shadow-sm hover:shadow-md transition-all duration-200 animate-scale-in ${
                kpi.interactive ? "cursor-pointer hover:border-[#F4B860]/30" : ""
              }`}
              onClick={kpi.interactive ? kpi.onClick : undefined}
              role={kpi.interactive ? "button" : undefined}
              tabIndex={kpi.interactive ? 0 : undefined}
              onKeyDown={kpi.interactive ? (e) => { if (e.key === "Enter" || e.key === " ") kpi.onClick?.() } : undefined}
            >
              <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${kpi.iconBg} w-fit mb-3 md:mb-4`}>
                <Icon className={`h-4 w-4 md:h-6 md:w-6 ${kpi.accent}`} />
              </div>
              <h3 className="text-xl md:text-[28px] font-bold text-foreground truncate">{kpi.value}</h3>
              <p className="text-xs md:text-sm font-medium text-muted-foreground mt-0.5 md:mt-1 truncate">
                {kpi.title}
                {kpi.interactive && outstandingInvoiceCount > 0 && (
                  <span className="ml-1.5 text-[10px] text-[#F4B860]/70">({outstandingInvoiceCount})</span>
                )}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── Outstanding Detail Dialog ── */}
      <Dialog open={outstandingOpen} onOpenChange={setOutstandingOpen}>
        <DialogContent className="dark:bg-[#223247] dark:border-[rgba(255,255,255,0.06)] max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#F4B860]/10">
                <AlertCircle className="h-5 w-5 text-[#F4B860]" />
              </div>
              Outstanding Balance Details
            </DialogTitle>
            <DialogDescription>
              Breakdown of unpaid balances by patient
            </DialogDescription>
          </DialogHeader>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Due</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{formatCurrency(outstandingBalance)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Unpaid Invoices</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{outstandingInvoiceCount}</p>
            </div>
          </div>

          {/* Patient List */}
          {outstandingPatients.length > 0 ? (
            <div className="space-y-2 mt-2">
              {outstandingPatients.map((p) => (
                <div
                  key={p.patientId}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-[#F4B860]/10 shrink-0">
                    <Users className="h-4 w-4 text-[#F4B860]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.patientName}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{p.patientPhone || "—"}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <FileText className="h-3 w-3" />
                        {p.invoiceCount}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#F4B860] shrink-0">{formatCurrency(p.totalDue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No outstanding balances</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}