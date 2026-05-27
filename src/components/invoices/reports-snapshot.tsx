import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TrendingUp, Users, Building2, Stethoscope } from "lucide-react"

// Mock Data - Replace with real Prisma queries later
const reportsData = {
  topDoctors: [
    { name: "Dr. Ahmed", revenue: 12500 },
    { name: "Dr. Sara", revenue: 9800 },
  ],
  topBranches: [
    { name: "Main Branch", revenue: 22000 },
    { name: "Downtown", revenue: 15000 },
  ]
}

export function ReportsSnapshot() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Revenue by Doctor */}
      <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)]">
        <div className="flex items-center gap-2 mb-6">
          <Stethoscope className="h-5 w-5 text-[#5BC0BE]" />
          <h3 className="text-lg font-semibold text-foreground">Revenue by Doctor</h3>
        </div>
        <div className="space-y-4">
          {reportsData.topDoctors.map((doc, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors">
              <Avatar className="h-9 w-9 border-2 border-[#5BC0BE]/20">
                <AvatarFallback className="bg-[#5BC0BE]/10 text-[#5BC0BE] font-semibold">{doc.name.charAt(4)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{doc.name}</p>
                <div className="w-full bg-muted/50 rounded-full h-1.5 mt-1.5">
                  <div className="bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] h-1.5 rounded-full" style={{ width: '70%' }} />
                </div>
              </div>
              <span className="text-sm font-bold text-foreground">${doc.revenue.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by Branch */}
      <div className="p-6 rounded-[24px] bg-gradient-to-br from-white to-[#F8FBFF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)]">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="h-5 w-5 text-[#6B9CFF]" />
          <h3 className="text-lg font-semibold text-foreground">Revenue by Branch</h3>
        </div>
        <div className="space-y-4">
          {reportsData.topBranches.map((branch, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors">
              <div className="p-2 rounded-lg bg-[#6B9CFF]/10">
                <Building2 className="h-5 w-5 text-[#6B9CFF]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{branch.name}</p>
                <div className="w-full bg-muted/50 rounded-full h-1.5 mt-1.5">
                  <div className="bg-gradient-to-r from-[#6B9CFF] to-[#89D6D2] h-1.5 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <span className="text-sm font-bold text-foreground">${branch.revenue.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}