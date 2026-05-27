import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Doctor {
  id: string
  name: string
  booked: number
  total: number
  remaining: number
  duration: number
}

interface DoctorAvailabilityProps {
  doctors: Doctor[]
}

export function DoctorAvailability({ doctors = [] }: DoctorAvailabilityProps) {
  return (
    <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_12px_30px_rgba(100,116,139,0.10)] animate-slide-up" style={{ animationDelay: '100ms' }}>
      <h3 className="text-lg font-semibold text-foreground mb-6">Doctor Availability</h3>
      
      {doctors.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">No doctors available today.</div>
      ) : (
        <div className="space-y-4">
          {doctors.map((doc) => {
            const progress = (doc.booked / doc.total) * 100
            const isFullyBooked = doc.remaining <= 0
            return (
              <div key={doc.id} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-[rgba(91,192,190,0.05)] transition-all duration-200 cursor-pointer">
                <Avatar className="h-10 w-10 border-2 border-[#5BC0BE]/20">
                  <AvatarFallback className="bg-[#5BC0BE]/10 text-[#5BC0BE] font-semibold">
                    {doc.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
                    <span className={`text-xs font-semibold ${isFullyBooked ? 'text-[#EF6B6B]' : 'text-[#5BC0BE]'}`}>
                      {isFullyBooked ? 'Fully Booked' : `${doc.remaining} slots left`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-full bg-muted/50 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${isFullyBooked ? 'bg-[#EF6B6B]' : 'bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF]'}`} 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{doc.duration}m</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}