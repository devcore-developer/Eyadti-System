import { BookingHeader } from "@/components/booking/booking-header"

export const dynamic = "force-dynamic"

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col font-[Inter,sans-serif] antialiased selection:bg-blue-100 selection:text-blue-900"
      style={{ background: "linear-gradient(180deg, #F8FBFF 0%, #F4F8FC 100%)" }}
    >
      {/* Subtle radial gradients in corners */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-100/25 rounded-full blur-[100px]" />
      </div>

      {/* ─── Sticky Header ─── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-10"
        style={{
          height: 76,
          background: "rgba(255,255,255,.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid #EEF2F7",
          boxShadow: "0 8px 30px rgba(15,23,42,.04)",
        }}
      >
        {/* Left — Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">Nexora</span>
        </div>

        {/* Middle — Title + Badge */}
        <div className="hidden sm:flex items-center gap-2.5">
          <span className="text-[15px] font-semibold text-slate-700">Online Booking</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Secure
          </span>
        </div>

        {/* Right — Controls */}
        <BookingHeader />
      </header>

      {/* ─── Main ─── */}
      <main className="relative z-10 flex-1">{children}</main>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-gray-100 bg-white/60 backdrop-blur-sm">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[13px] text-slate-400">
            Powered by <span className="font-semibold text-slate-600">Nexora</span> &copy; {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-5 text-[13px] text-slate-400">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}