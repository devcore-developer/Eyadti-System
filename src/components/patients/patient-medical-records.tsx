import { AlertCircle, Activity, ClipboardList, FileText } from "lucide-react"

const records = [
  { title: "Chief Complaint", content: "Patient complains of recurring headache for the past 3 days, localized in the frontal area.", icon: AlertCircle, color: "text-[#EF6B6B]", bg: "bg-[#EF6B6B]/5", border: "border-[#EF6B6B]/10" },
  { title: "Diagnosis", content: "Tension-type headache. No signs of migraines or underlying conditions.", icon: Activity, color: "text-[#5BC0BE]", bg: "bg-[#5BC0BE]/5", border: "border-[#5BC0BE]/10" },
  { title: "Treatment Plan", content: "Prescribed Ibuprofen 400mg as needed. Recommended stress management and hydration.", icon: ClipboardList, color: "text-[#6B9CFF]", bg: "bg-[#6B9CFF]/5", border: "border-[#6B9CFF]/10" },
  { title: "Notes", content: "Follow-up in 2 weeks if symptoms persist. Patient advised to reduce screen time.", icon: FileText, color: "text-[#F4B860]", bg: "bg-[#F4B860]/5", border: "border-[#F4B860]/10" },
]

export function PatientMedicalRecords() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {records.map((record, index) => {
        const Icon = record.icon
        return (
          <div 
            key={index} 
            className={`p-6 rounded-[20px] bg-white dark:bg-[#223247] border ${record.border} dark:border-[rgba(255,255,255,0.06)] shadow-[0_8px_20px_rgba(100,116,139,0.06)] hover:-translate-y-1 hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${record.bg}`}>
                <Icon className={`h-5 w-5 ${record.color}`} />
              </div>
              <h3 className="text-base font-semibold text-foreground">{record.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{record.content}</p>
          </div>
        )
      })}
    </div>
  )
}