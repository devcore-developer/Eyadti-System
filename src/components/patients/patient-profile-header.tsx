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
      // ✨ تقليل الـ Padding على الموبايل
      className="relative overflow-hidden rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 md:p-8 border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(107,156,255,.08)]"
      style={{ background: 'linear-gradient(135deg, rgba(91,192,190,0.12), rgba(107,156,255,0.12))' }}
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />

      {/* ✨ تخطيط عمودي على الموبايل، أفقي على الـ Desktop */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
          {/* ✨ Avatar حجمه أصغر على الموبايل */}
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-white/50 dark:border-[#223247] shadow-lg shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF] text-white text-xl sm:text-2xl font-bold">
              {name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">{name}</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-white/80 dark:bg-[#223247]/80 text-[#5BC0BE] border border-[#5BC0BE]/20 shrink-0">
                #{patientId}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1"><Activity className="h-3 w-3 sm:h-4 sm:w-4 text-[#5BC0BE]" /> {age}y, {gender}</div>
              <div className="flex items-center gap-1"><Phone className="h-3 w-3 sm:h-4 sm:w-4 text-[#6B9CFF]" /> {phone}</div>
              {email && <div className="hidden sm:flex items-center gap-1"><Mail className="h-4 w-4 text-[#89D6D2]" /> {email}</div>}
            </div>
          </div>
        </div>

        {/* ✨ أزرار بعرض كامل على الموبايل */}
        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
          <Button className="col-span-2 sm:w-auto bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-sm hover:-translate-y-0.5 transition-all duration-200 rounded-xl h-10 sm:h-9 text-sm">
            <Stethoscope className="h-4 w-4 mr-2" /> New Visit
          </Button>
          <Button variant="outline" className="rounded-xl border-dashed border-[#6B9CFF]/50 text-[#6B9CFF] hover:bg-[#6B9CFF]/5 h-10 sm:h-9 text-sm">
            <FileText className="h-4 w-4 mr-1" /> Rx
          </Button>
          <Button variant="outline" className="rounded-xl border-dashed border-[#5BC0BE]/50 text-[#5BC0BE] hover:bg-[#5BC0BE]/5 h-10 sm:h-9 text-sm">
            <Upload className="h-4 w-4 mr-1" /> File
          </Button>
        </div>
      </div>
    </div>
  )
}