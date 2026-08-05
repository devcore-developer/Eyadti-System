"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, FileDown, Loader2 } from "lucide-react"

export function PrintButton() {
  const [isGenerating, setIsGenerating] = useState(false)

  const handlePrint = () => {
    const printContent = document.getElementById("printable-invoice")
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 40px; color: #1a1a1a; }
          .invoice-container { max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; margin-bottom: 24px; }
          .clinic-name { font-size: 24px; font-weight: 700; }
          .clinic-subtitle { font-size: 14px; color: #6b7280; margin-top: 4px; }
          .bill-to { text-align: right; }
          .bill-to-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
          .patient-name { font-size: 16px; font-weight: 600; margin-top: 4px; }
          .patient-info { font-size: 13px; color: #6b7280; }
          .items-header { display: grid; grid-template-columns: 3fr 1fr 1fr 1fr; padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
          .item-row { display: grid; grid-template-columns: 3fr 1fr 1fr 1fr; padding: 16px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
          .item-description { font-weight: 500; }
          .item-qty, .item-price { color: #6b7280; }
          .item-total { font-weight: 600; text-align: right; }
          .totals { display: flex; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 2px solid #e5e7eb; }
          .totals-table { width: 250px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .totals-row.total { font-size: 18px; font-weight: 700; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 6px; }
          .footer { margin-top: 48px; text-align: center; font-size: 12px; color: #9ca3af; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          ${printContent.innerHTML}
        </div>
        <div class="footer">
          <p>Thank you for your business</p>
          <p>Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  const handleDownloadPDF = async () => {
    setIsGenerating(true)
    try {
      // Simple approach: use print dialog which allows "Save as PDF" in most browsers
      handlePrint()
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="rounded-xl border-dashed gap-2" onClick={handlePrint}>
        <Printer className="h-4 w-4" /> Print
      </Button>
      <Button variant="outline" size="sm" className="rounded-xl border-dashed gap-2" onClick={handleDownloadPDF} disabled={isGenerating}>
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} PDF
      </Button>
    </div>
  )
}