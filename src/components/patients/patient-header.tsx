import { Users } from "lucide-react"

interface PatientHeaderProps {
  totalPatients: number
}

export function PatientHeader({ totalPatients }: PatientHeaderProps) {
  return (
    <div 
      className="relative overflow-hidden rounded-[24px] p-8 md:p-10 border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)]"
      style={{ background: 'linear-gradient(135deg, rgba(91,192,190,0.08), rgba(107,156,255,0.08))' }}
    >
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Patients</h1>
          <p className="mt-2 text-base text-muted-foreground max-w-xl">
            Manage all patient records, visits, prescriptions and medical history.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white/80 dark:bg-[#223247]/80 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-sm border border-white/50 dark:border-[rgba(255,255,255,0.1)]">
          <div className="p-2 rounded-xl bg-[#5BC0BE]/10">
            <Users className="h-5 w-5 text-[#5BC0BE]" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Patients</p>
            <p className="text-xl font-bold text-foreground">{totalPatients.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}