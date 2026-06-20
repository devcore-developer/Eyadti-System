"use client"

import { useState } from "react"
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { Download, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { getRevenueReportData } from "@/lib/actions/super-admin"

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica", fontSize: 10 },
  header: { textAlign: "center", marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#3b82f6", paddingBottom: 15 },
  title: { fontSize: 20, color: "#111827", marginBottom: 5 },
  subtitle: { fontSize: 10, color: "#6b7280" },
  totalBox: { backgroundColor: "#f0f9ff", padding: 10, borderRadius: 5, marginBottom: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalText: { fontSize: 14, color: "#1e40af", fontWeight: "bold" },
  table: { width: "100%" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingVertical: 4 },
  headerRow: { flexDirection: "row", backgroundColor: "#f9fafb", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingVertical: 4 },
  cell: { padding: 5, fontSize: 9, color: "#1a1a1a" },
  headerCell: { padding: 5, fontSize: 9, fontWeight: "bold", color: "#374151" },
  col1: { width: "25%" }, col2: { width: "18%" }, col3: { width: "15%" }, col4: { width: "12%" }, col5: { width: "12%" }, col6: { width: "18%", textAlign: "right" }
});

const PdfDocument = ({ data, totalRevenue, dateRange }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Nexora Revenue Report</Text>
        <Text style={styles.subtitle}>Period: {dateRange.from} to {dateRange.to}</Text>
      </View>
      
      <View style={styles.totalBox}>
        <Text style={styles.totalText}>Total Collected Revenue</Text>
        <Text style={styles.totalText}>{totalRevenue.toLocaleString()} EGP</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.headerRow}>
          <View style={[styles.headerCell, styles.col1]}><Text>Clinic Name</Text></View>
          <View style={[styles.headerCell, styles.col2]}><Text>Owner</Text></View>
          <View style={[styles.headerCell, styles.col3]}><Text>Plan</Text></View>
          <View style={[styles.headerCell, styles.col4]}><Text>Months</Text></View>
          <View style={[styles.headerCell, styles.col5]}><Text>Status</Text></View>
          <View style={[styles.headerCell, styles.col6]}><Text>Revenue (EGP)</Text></View>
        </View>
        
        {data.map((clinic: any, i: number) => (
          <View style={styles.row} key={i}>
            <View style={[styles.cell, styles.col1]}><Text>{clinic.clinicName}</Text></View>
            <View style={[styles.cell, styles.col2]}><Text>{clinic.ownerName}</Text></View>
            <View style={[styles.cell, styles.col3]}><Text>{clinic.planName}</Text></View>
            <View style={[styles.cell, styles.col4]}><Text>{clinic.activeMonths} Month(s)</Text></View>
            <View style={[styles.cell, styles.col5]}><Text>{clinic.status}</Text></View>
            <View style={[styles.cell, styles.col6]}><Text>{clinic.revenue.toLocaleString()}</Text></View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
)

export function DownloadPdfButton() {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
  })
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0])

  const handleDownload = async () => {
    if (!from || !to) return;
    setLoading(true)
    try {
      const result = await getRevenueReportData(from, to)
      if (!result) throw new Error("Failed to fetch data")
      
      const blob = await pdf(
        <PdfDocument data={result.data} totalRevenue={result.totalRevenue} dateRange={{ from, to }} />
      ).toBlob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `nexora-revenue-${from}-to-${to}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setOpen(false)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-9 px-4 py-2 transition-colors">
          <CalendarDays className="mr-2 h-4 w-4" />
          Revenue Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Report Period</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid items-center grid-cols-[100px_1fr] gap-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
          </div>
          <div className="grid items-center grid-cols-[100px_1fr] gap-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
          </div>
          <Button onClick={handleDownload} disabled={loading} className="w-full mt-2">
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}