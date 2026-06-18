import { auth } from "@/lib/auth"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { CommandPalette } from "@/components/dashboard/command-palette"
import { UserProfileMenu } from "@/components/dashboard/user-profile-menu"
import { prisma } from "@/lib/db"
import { getSelectedBranch } from "@/lib/actions/branch-context"
import { SubscriptionGuard } from "@/components/billing/subscription-guard"

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // ✅ إضافة التحقق من دور السوبر أدمن
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

  // ✅ السوبر أدمن لا يحتاج للاشتراك
  const subscription = !isSuperAdmin && session?.user?.clinicId 
    ? await prisma.subscription.findUnique({ 
        where: { clinicId: session.user.clinicId }, 
        select: { status: true, trialEndsAt: true, endDate: true, currentPeriodEnd: true } 
      }) 
    : null

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
      <div className="hidden lg:flex print:hidden">
        <Sidebar user={session?.user} branches={branches} selectedBranchId={selectedBranchId} />
      </div>
      
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 print:overflow-visible">
        
        {/* ── Mobile Top Navbar ── */}
        <header className="lg:hidden print:hidden sticky top-0 z-40 h-14 border-b border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white/80 dark:bg-[#17212F]/80 backdrop-blur-xl px-3 flex items-center justify-between">
          <MobileNav clinicName={clinic?.name || "Nexora Clinic"}>
            <Sidebar user={session?.user} branches={branches} selectedBranchId={selectedBranchId} isMobile />
          </MobileNav>
          
          <div className="flex items-center gap-1">
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
        <header className="hidden lg:flex print:hidden h-16 border-b border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white/70 dark:bg-[#17212F]/70 backdrop-blur-xl px-6 items-center justify-between shadow-[0_2px_20px_rgba(100,116,139,0.04)] z-10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] bg-clip-text text-transparent truncate">
              {clinic?.name || "Nexora Clinic"}
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden xl:flex items-center gap-1 text-xs text-muted-foreground bg-slate-100/80 dark:bg-[#223247]/50 px-2.5 py-1.5 rounded-lg border border-[rgba(148,163,184,0.1)] shadow-sm">
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 print:p-0 print:overflow-visible print:bg-white pb-20 lg:pb-8">
          <div className="animate-fade-in-up print:animate-none max-w-[1400px] mx-auto">
            {/* ✅ استثناء السوبر أدمن من حارس الاشتراك */}
            {!isSuperAdmin ? (
              <SubscriptionGuard 
                status={subscription?.status || null}
                trialEndsAt={subscription?.trialEndsAt || null}
                endDate={subscription?.currentPeriodEnd || null}
              >
                {children}
              </SubscriptionGuard>
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      {/* ✅ CommandPalette - لو وجدت مشاكل في النقر، يمكنك تعليق هذا السطر مؤقتاً */}
      <CommandPalette />
    </div>
  )
}