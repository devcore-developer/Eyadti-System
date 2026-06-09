import { MotionWrapper } from "./motion-wrapper"
import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#5BC0BE]/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-20 right-0 w-[600px] h-[400px] bg-[#6B9CFF]/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <MotionWrapper>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/5 mb-8">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 tracking-wide">
              NOW MANAGING 100,000+ APPOINTMENTS
            </span>
          </div>
        </MotionWrapper>

        <MotionWrapper delay={0.1}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-foreground max-w-4xl mx-auto leading-[1.1]">
            Run Your Clinic{" "}
            <span className="bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] bg-clip-text text-transparent">
              Smarter
            </span>
          </h1>
        </MotionWrapper>

        <MotionWrapper delay={0.2}>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Everything your clinic needs. Patients, appointments, invoices, waiting room, and online booking — all in one elegant system.
          </p>
        </MotionWrapper>

        <MotionWrapper delay={0.3}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-white px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] shadow-[0_15px_35px_rgba(107,156,255,0.3)] hover:-translate-y-0.5 transition-all"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a 
              href="#" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-foreground px-8 py-3.5 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              <Play className="h-4 w-4 text-[#6B9CFF]" />
              Book Demo
            </a>
          </div>
        </MotionWrapper>

        {/* Dashboard Mockup */}
        <MotionWrapper delay={0.5} className="mt-20">
          <div className="premium-card p-2 md:p-3 rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 max-w-5xl mx-auto">
            <div className="bg-slate-50 dark:bg-[#17212F] rounded-[20px] overflow-hidden">
              {/* Fake Browser Bar */}
              <div className="h-10 bg-white dark:bg-[#1E293B] border-b border-border flex items-center px-4 gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <div className="ml-4 h-5 w-64 rounded-md bg-muted" />
              </div>
              
              {/* Fake Dashboard Layout */}
              <div className="flex h-[300px] md:h-[450px]">
                {/* Sidebar */}
                <div className="hidden md:flex w-56 bg-white dark:bg-[#1B2838] border-r border-border flex-col p-4 space-y-3">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF]" />
                  <div className="h-4 w-full rounded bg-muted mt-4" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-4/5 rounded bg-[#5BC0BE]/20 border-l-2 border-[#5BC0BE]" />
                  <div className="h-4 w-full rounded bg-muted" />
                </div>
                {/* Main Content */}
                <div className="flex-1 p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-20 rounded-xl bg-[#5BC0BE]/10 p-4">
                      <div className="h-3 w-12 rounded bg-muted mb-2" />
                      <div className="h-6 w-16 rounded bg-[#5BC0BE]/30" />
                    </div>
                    <div className="h-20 rounded-xl bg-[#6B9CFF]/10 p-4">
                      <div className="h-3 w-12 rounded bg-muted mb-2" />
                      <div className="h-6 w-16 rounded bg-[#6B9CFF]/30" />
                    </div>
                    <div className="h-20 rounded-xl bg-emerald-500/10 p-4">
                      <div className="h-3 w-12 rounded bg-muted mb-2" />
                      <div className="h-6 w-16 rounded bg-emerald-500/30" />
                    </div>
                  </div>
                  <div className="h-40 md:h-64 rounded-xl bg-muted/30 border border-border" />
                </div>
              </div>
            </div>
          </div>
        </MotionWrapper>
      </div>
    </section>
  )
}