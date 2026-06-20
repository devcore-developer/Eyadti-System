"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { Download } from "lucide-react"
import { getAllClinicsForTable } from "@/lib/actions/super-admin"

// شكل التقرير كـ PDF
const PdfDocument = ({ data }: { data: any[] }) => (
  <div style={{ padding: "30px", fontFamily: "Arial, sans-serif", color: "#1a1a1a" }}>
    <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "2px solid #3b82f6", paddingBottom: "15px" }}>
      <h1 style={{ fontSize: "24px", margin: 0, color: "#111827" }}>Nexora Platform Report</h1>
      <p style={{ fontSize: "12px", color: "#6b7280", margin: "5px 0 0 0" }}>
        Generated on {new Date().toLocaleDateString()}
      </p>
    </div>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
      <thead>
        <tr style={{ backgroundColor: "#f9fafb", textAlign: "left" }}>
          <th style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>Clinic Name</th>
          <th style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>Owner</th>
          <th style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>Plan</th>
          <th style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>Status</th>
          <th style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>Users</th>
          <th style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>Patients</th>
        </tr>
      </thead>
      <tbody>
        {data.map((clinic) => (
          <tr key={clinic.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
            <td style={{ padding: "8px" }}>{clinic.name}</td>
            <td style={{ padding: "8px" }}>{clinic.owner?.name || "N/A"}</td>
            <td style={{ padding: "8px" }}>{clinic.subscription?.plan?.name || "None"}</td>
            <td style={{ padding: "8px", color: clinic.subscription?.status === 'ACTIVE' ? '#10b981' : '#ef4444' }}>
              {clinic.subscription?.status || "INACTIVE"}
            </td>
            <td style={{ padding: "8px" }}>{clinic._count.users}</td>
            <td style={{ padding: "8px" }}>{clinic._count.patients}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export function DownloadPdfButton() {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const clinics = await getAllClinicsForTable()
      
      // إنشاء الـ PDF كـ Blob
      const blob = await pdf(<PdfDocument data={clinics} />).toBlob()
      
      // إنشاء رابط تحميل وهمي وتفعيله
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `nexora-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      
      // تنظيف الذاكرة
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleDownload} 
      disabled={loading}
      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-9 px-4 py-2 transition-colors disabled:opacity-70"
    >
      {loading ? (
        "Generating PDF..."
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" /> Export PDF Report
        </>
      )}
    </button>
  )
}