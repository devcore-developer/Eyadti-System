import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { Users } from "lucide-react"

// 1. تعريف الـ Type بنفس شكل الداتابيز
type Doctor = {
  id: string
  name: string
  specialization: string | null
  patientCount: number
  appointmentCount: number
}

interface TopDoctorsProps {
  doctors: Doctor[]
}

export function TopDoctors({ doctors = [] }: TopDoctorsProps) {
  // حساب أقصى عدد للمرضى عشان الـ Progress Bar يشتغل صح
  const maxPatients = Math.max(...doctors.map(d => d.patientCount), 1)

  return (
    <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_12px_30px_rgba(100,116,139,0.10)] animate-slide-up">
      <h3 className="text-lg font-semibold text-foreground mb-6">Top Doctors</h3>

      {doctors.length === 0 ? (
        <EmptyState icon={Users} title="No data yet" description="Doctor analytics will appear here." className="py-8" />
      ) : (
        <div className="space-y-4">
          {doctors.map((doc) => {
            const progress = (doc.patientCount / maxPatients) * 100
            
            return (
              <div key={doc.id} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-[rgba(91,192,190,0.05)] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                <Avatar className="h-10 w-10 border-2 border-[#5BC0BE]/20">
                  <AvatarFallback className="bg-[#5BC0BE]/10 text-[#5BC0BE] font-semibold">
                    {doc.name?.charAt(0) || "D"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
                  <div className="w-full bg-muted/50 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-foreground">{doc.appointmentCount} appts</p>
                  <p className="text-xs text-muted-foreground">{doc.patientCount} pts</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}