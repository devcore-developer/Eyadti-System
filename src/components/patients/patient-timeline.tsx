import { Stethoscope, FileText, CreditCard, Paperclip, Clock } from "lucide-react"

const timelineData = [
  { id: 1, type: "visit", title: "General Checkup", description: "Diagnosis: Healthy, vitals normal.", time: "Today, 10:30 AM", icon: Stethoscope, color: "text-[#5BC0BE]", bg: "bg-[#5BC0BE]/10" },
  { id: 2, type: "prescription", title: "Prescription #RX-204", description: "Ibuprofen 400mg, Vitamin D.", time: "Today, 10:35 AM", icon: FileText, color: "text-[#6B9CFF]", bg: "bg-[#6B9CFF]/10" },
  { id: 3, type: "invoice", title: "Invoice Paid", description: "Amount: $150.00", time: "Yesterday", icon: CreditCard, color: "text-[#6BCB77]", bg: "bg-[#6BCB77]/10" },
  { id: 4, type: "attachment", title: "Blood Test Report", description: "CBC and Lipid Panel results.", time: "Oct 12, 2023", icon: Paperclip, color: "text-[#89D6D2]", bg: "bg-[#89D6D2]/10" },
]

export function PatientTimeline() {
  return (
    <div className="relative space-y-0">
      {/* The vertical line */}
      <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#6B9CFF]/20 via-[#5BC0BE]/20 to-transparent" />

      <div className="space-y-6">
        {timelineData.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.id} className="relative flex items-start gap-6 group">
              <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-[#223247] shadow-[0_8px_20px_rgba(100,116,139,0.08)] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </div>
              
              <div className="flex-1 p-5 rounded-[18px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_8px_20px_rgba(100,116,139,0.08)] hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {item.time}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}