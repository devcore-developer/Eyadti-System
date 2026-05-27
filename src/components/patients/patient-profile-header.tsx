import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Phone, Mail, CalendarDays, Activity, Stethoscope, FileText, Upload } from "lucide-react"

interface PatientProfileHeaderProps {
  name: string
  patientId: string
  age: number
  gender: string
  phone: string
  email?: string
  lastVisit: string
}

export function PatientProfileHeader({ name, patientId, age, gender, phone, email, lastVisit }: PatientProfileHeaderProps) {
  return (
    <div 
      className="relative overflow-hidden rounded-[28px] p-8 md:p-10 border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_20px_50px_rgba(107,156,255,.10)]"
      style={{ background: 'linear-gradient(135deg, rgba(91,192,190,0.12), rgba(107,156,255,0.12))' }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-white/50 dark:border-[#223247] shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF] text-white text-3xl font-bold">
              {name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">{name}</h1>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/80 dark:bg-[#223247]/80 text-[#5BC0BE] border border-[#5BC0BE]/20">
                #{patientId}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1.5"><Activity className="h-4 w-4 text-[#5BC0BE]" /> {age} yrs, {gender}</div>
              <div className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-[#6B9CFF]" /> {phone}</div>
              {email && <div className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-[#89D6D2]" /> {email}</div>}
              <div className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-[#F4B860]" /> Last visit: {lastVisit}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_8px_20px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 transition-all duration-200 rounded-xl">
            <Stethoscope className="h-4 w-4 mr-2" /> New Visit
          </Button>
          <Button variant="outline" className="rounded-xl border-dashed border-[#6B9CFF]/50 text-[#6B9CFF] hover:bg-[#6B9CFF]/5 hover:text-[#6B9CFF]">
            <FileText className="h-4 w-4 mr-2" /> Prescription
          </Button>
          <Button variant="outline" className="rounded-xl border-dashed border-[#5BC0BE]/50 text-[#5BC0BE] hover:bg-[#5BC0BE]/5 hover:text-[#5BC0BE]">
            <Upload className="h-4 w-4 mr-2" /> Upload
          </Button>
        </div>
      </div>
    </div>
  )
}