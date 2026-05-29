import { auth } from "@/lib/auth"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { CommandPalette } from "@/components/dashboard/command-palette"
import { UserProfileMenu } from "@/components/dashboard/user-profile-menu"
import { prisma } from "@/lib/db"
import { getSelectedBranch } from "@/lib/actions/branch-context"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  const branches = session?.user?.clinicId 
    ? await prisma.branch.findMany({ 
        where: { clinicId: session.user.clinicId, isActive: true }, 
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" }
      }) 
    : []
    
  const selectedBranchId = await getSelectedBranch()
  const clinic = session?.user?.clinicId 
    ? await prisma.clinic.findUnique({ 
        where: { id: session.user.clinicId }, 
        select: { name: true } 
      }) 
    : null

  const selectedBranch = branches.find(b => b.id === selectedBranchId)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50 dark:bg-[#0F172A] print:h-auto print:overflow-visible print:bg-white">
      
      {/* ── Desktop Sidebar ── */}
      <div className="hidden md:flex print:hidden">
        <Sidebar 
          user={session?.user} 
          branches={branches} 
          selectedBranchId={selectedBranchId} 
        />
      </div>
      
      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
        
        {/* ── Mobile Top Navbar ── */}
        <header className="md:hidden print:hidden sticky top-0 z-40 h-14 border-b border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white/80 dark:bg-[#17212F]/80 backdrop-blur-xl px-4 flex items-center justify-between">
          {/* بنبعت الـ Sidebar كـ children عشان يتفذ على السيرفر */}
          <MobileNav clinicName={clinic?.name || "Eyadti"}>
            <Sidebar 
              user={session?.user} 
              branches={branches} 
              selectedBranchId={selectedBranchId} 
              isMobile 
            />
          </MobileNav>
          
          <div className="flex items-center gap-2">
            {session?.user?.id && session?.user?.clinicId && (
              <NotificationBell userId={session.user.id} clinicId={session.user.clinicId} />
            )}
            {session?.user && (
              <UserProfileMenu 
                userName={session.user.name || "User"}
                userEmail={session.user.email || ""}
                userRole={session.user.role || ""}
                clinicName={clinic?.name || "Clinic"}
                branchName={selectedBranch?.name}
              />
            )}
          </div>
        </header>

        {/* ── Desktop Header ── */}
        <header className="hidden md:flex print:hidden h-16 border-b border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white/70 dark:bg-[#17212F]/70 backdrop-blur-xl px-6 items-center justify-between shadow-[0_2px_20px_rgba(100,116,139,0.05)] z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] bg-clip-text text-transparent">
              {clinic?.name || "Eyadti Clinic"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground bg-slate-100/80 dark:bg-[#223247]/50 px-2.5 py-1.5 rounded-lg border border-[rgba(148,163,184,0.1)] shadow-sm">
              <span className="font-mono text-[10px]">⌘</span>
              <span className="font-mono text-[10px]">K</span>
            </div>
            {session?.user?.id && session?.user?.clinicId && (
              <NotificationBell userId={session.user.id} clinicId={session.user.clinicId} />
            )}
            {session?.user && (
              <UserProfileMenu 
                userName={session.user.name || "User"}
                userEmail={session.user.email || ""}
                userRole={session.user.role || ""}
                clinicName={clinic?.name || "Clinic"}
                branchName={selectedBranch?.name}
              />
            )}
          </div>
        </header>
        
        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 print:p-0 print:overflow-visible print:bg-white pb-24 md:pb-8">
          <div className="animate-fade-in-up print:animate-none">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette />
    </div>
  )
}