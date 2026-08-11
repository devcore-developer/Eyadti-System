"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, FileDown, Loader2, Receipt } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"

type PrintFormat = "a4" | "80mm" | "58mm"

interface PrintButtonProps {
  invoiceId: string
  invoiceNumber: string
  clinicName?: string | null
  clinicAddress?: string | null
  clinicPhone?: string | null
  clinicLogo?: string | null
  patientName: string
  patientPhone?: string | null
  items: { description: string; quantity: number; unitPrice: number; lineTotal: number }[]
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: string
  // استخدام any عشان الـ amount ممكن ييجي من بريزما كـ Decimal object
  payments?: { amount: any; method: string; createdAt: Date }[]
}

export function PrintButton({
  invoiceId, invoiceNumber, clinicName, clinicAddress, clinicPhone,
  patientName, patientPhone, items, totalAmount, paidAmount,
  remainingAmount, status, payments
}: PrintButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<PrintFormat>("a4")

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  const formatDate = (date: Date) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date))

  const handlePrint = (selectedFormat?: PrintFormat) => {
    const printFormat = selectedFormat || format
    setIsGenerating(true)
    setOpen(false)

    const printWindow = window.open("", "_blank", "width=800,height=600")
    if (!printWindow) { setIsGenerating(false); return }

    const isThermal = printFormat !== "a4"
    const width = printFormat === "80mm" ? "80mm" : printFormat === "58mm" ? "58mm" : "100%"
    const padding = printFormat === "80mm" ? "5mm" : printFormat === "58mm" ? "3mm" : "20mm"

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Invoice ${invoiceNumber}</title>
        <style>
          @page { size: ${width} auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            width: ${width}; 
            margin: 0 auto; 
            padding: ${padding};
            color: #000; 
            font-size: ${isThermal ? '10px' : '12px'};
            line-height: 1.4;
          }
          .header { text-align: center; ${!isThermal ? 'display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px;' : 'margin-bottom: 10px;'} }
          .clinic-name { font-size: ${isThermal ? '14px' : '20px'}; font-weight: 700; }
          .clinic-details { font-size: ${isThermal ? '9px' : '11px'}; color: #555; margin-top: 2px; }
          .patient-info { margin-bottom: 10px; ${isThermal ? 'border-bottom: 1px dashed #000; padding-bottom: 5px;' : 'margin-top: 15px;'} }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .items-table { width: 100%; ${isThermal ? 'border-top: 1px dashed #000; border-bottom: 1px dashed #000;' : 'border-collapse: collapse; margin-top: 15px;'} }
          th, td { text-align: left; padding: ${isThermal ? '3px 2px' : '8px 5px'}; ${!isThermal ? 'border-bottom: 1px solid #eee;' : ''} }
          th { font-weight: 600; font-size: ${isThermal ? '9px' : '10px'}; text-transform: uppercase; }
          .text-right { text-align: right; }
          .totals { margin-top: ${isThermal ? '10px' : '20px'}; ${!isThermal ? 'display: flex; justify-content: flex-end;' : 'border-top: 1px dashed #000; padding-top: 5px;'} }
          .totals-table { width: ${isThermal ? '100%' : '250px'}; }
          .total-row { display: flex; justify-content: space-between; padding: 2px 0; }
          .grand-total { font-size: ${isThermal ? '12px' : '16px'}; font-weight: 700; border-top: ${isThermal ? '1px dashed #000' : '2px solid #000'}; padding-top: 5px; margin-top: 5px; }
          .status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; margin-top: 5px; }
          .bg-green { background: #d1fae5; color: #065f46; }
          .bg-yellow { background: #fef3c7; color: #92400e; }
          .bg-red { background: #fee2e2; color: #991b1b; }
          .bg-gray { background: #f3f4f6; color: #374151; }
          .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #888; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="clinic-name">${clinicName || 'Clinic Name'}</div>
            ${clinicAddress ? `<div class="clinic-details">${clinicAddress}</div>` : ''}
            ${clinicPhone ? `<div class="clinic-details">Tel: ${clinicPhone}</div>` : ''}
          </div>
          ${!isThermal ? `<div class="text-right"><div class="clinic-name">INVOICE</div><div class="clinic-details">#${invoiceNumber}</div><div class="clinic-details">${formatDate(new Date())}</div></div>` : ''}
        </div>
        
        ${isThermal ? `<div style="text-align:center; font-weight:bold; margin: 5px 0;">TAX INVOICE</div><div class="row"><span>#${invoiceNumber}</span><span>${formatDate(new Date())}</span></div>` : ''}

        <div class="patient-info">
          <div class="row"><strong>Bill To:</strong></div>
          <div style="font-weight:600; font-size:${isThermal?'11px':'14px'}">${patientName}</div>
          ${patientPhone ? `<div class="clinic-details">${patientPhone}</div>` : ''}
          <div class="status-badge ${status === 'PAID' ? 'bg-green' : status === 'PARTIAL' ? 'bg-yellow' : 'bg-gray'}">${status}</div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              ${!isThermal ? '<th class="text-right">Qty</th>' : '<th class="text-right">Q</th>'}
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td style="max-width:${isThermal?'100px':'300px'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                <td class="text-right" style="font-weight:500">${formatCurrency(item.lineTotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-table">
            <div class="total-row"><span>Total</span><span>${formatCurrency(totalAmount)}</span></div>
            <div class="total-row"><span>Paid</span><span style="color:#065f46; font-weight:600">${formatCurrency(paidAmount)}</span></div>
            ${remainingAmount > 0 ? `<div class="total-row"><span>Remaining</span><span style="color:#991b1b; font-weight:600">${formatCurrency(remainingAmount)}</span></div>` : ''}
            <div class="total-row grand-total"><span>Balance Due</span><span>${formatCurrency(remainingAmount)}</span></div>
          </div>
        </div>

        ${payments && payments.length > 0 && !isThermal ? `
        <div style="margin-top:30px;">
          <h4 style="font-size:11px; text-transform:uppercase; color:#666; margin-bottom:8px;">Payment History</h4>
          ${payments.map(p => `<div style="display:flex; justify-content:space-between; font-size:11px; padding:4px 0; border-bottom:1px solid #eee;"><span>${p.method} - ${formatDate(p.createdAt)}</span><span>${formatCurrency(Number(p.amount))}</span></div>`).join('')}
        </div>
        ` : ''}

        <div class="footer">Thank you for choosing us<br/>Generated on ${new Date().toLocaleString()}</div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    
    setTimeout(() => {
      printWindow.print()
      setIsGenerating(false)
    }, 300)
  }

  return (
    <div className="flex gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-xl border-dashed gap-2" disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} 
            Print
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-[#6B9CFF]" /> Select Print Format</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {[
              { id: "a4" as PrintFormat, title: "Standard A4", desc: "Full size invoice for folders" },
              { id: "80mm" as PrintFormat, title: "Thermal 80mm", desc: "Standard receipt printer" },
              { id: "58mm" as PrintFormat, title: "Thermal 58mm", desc: "Small mobile receipt printer" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => { setFormat(opt.id); handlePrint(opt.id); }}
                className="flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:border-[#6B9CFF] hover:bg-[#6B9CFF]/5 text-left border-border"
              >
                <Printer className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">{opt.title}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <DialogFooter className="sm:justify-start">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="outline" size="sm" className="rounded-xl border-dashed gap-2" onClick={() => handlePrint("a4")} disabled={isGenerating}>
        <FileDown className="h-4 w-4" /> PDF
      </Button>
    </div>
  )
}