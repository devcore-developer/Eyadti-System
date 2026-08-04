import { ShieldBan, MessageCircle, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Clinic Suspended",
}

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0F172A] dark:via-[#17212F] dark:to-[#0F172A] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Illustration */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
              <ShieldBan className="w-16 h-16 text-amber-500" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
              <span className="text-xl">🔒</span>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-[#1D2A3B] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Clinic Suspended
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
            Your clinic has been temporarily suspended.
            <br />
            Please contact Nexora Support to restore your access.
          </p>

          {/* Contact Buttons */}
          <div className="space-y-3">
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-500/25"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Support
            </a>

            <a
              href="mailto:support@nexora.app"
              className="flex items-center justify-center gap-3 w-full px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors border border-slate-200 dark:border-white/10"
            >
              <Mail className="w-5 h-5" />
              support@nexora.app
            </a>
          </div>
        </div>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-300 dark:text-slate-600 mt-8">
          Nexora Clinic Management System
        </p>
      </div>
    </div>
  )
}