import { Users, Clock, CheckCircle, Stethoscope } from "lucide-react"

const patients = [
  { name: "Ahmed Hassan", status: "Waiting", time: "09:00 AM" },
  { name: "Sara Ali", status: "In Consultation", time: "09:30 AM" },
]

export function WaitingRoom() {
  return (
    <div className="p-6 md:p-8 rounded-[24px] bg-gradient-to-br from-white/95 to-[#F0F8FF]/95 dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)] animate-fade">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-[#6B9CFF]" /> Waiting Room
        </h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-[#F4B860]/10 text-[#F4B860] text-xs font-semibold">1 Waiting</span>
          <span className="px-3 py-1 rounded-full bg-[#5BC0BE]/10 text-[#5BC0BE] text-xs font-semibold">1 In Room</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patients.map((p, index) => (
          <div 
            key={index}
            className="group p-5 rounded-[20px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer"
            style={{ 
              background: p.status === 'Waiting' 
                ? 'linear-gradient(135deg, rgba(255,255,255,1), rgba(255,249,238,1))' 
                : 'linear-gradient(135deg, rgba(255,255,255,1), rgba(240,248,255,1))' 
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">{p.name}</p>
              <span className="flex items-center gap-1 text-xs font-medium">
                {p.status === 'Waiting' ? <Clock className="h-3 w-3 text-[#F4B860]" /> : <Stethoscope className="h-3 w-3 text-[#5BC0BE]" />}
                <span className={p.status === 'Waiting' ? 'text-[#F4B860]' : 'text-[#5BC0BE]'}>{p.status}</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Scheduled: {p.time}</p>
          </div>
        ))}
      </div>
    </div>
  )
}