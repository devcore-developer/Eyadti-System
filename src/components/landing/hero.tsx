import { MotionWrapper } from "./motion-wrapper"
import Link from "next/link"
import { ArrowRight, Play, CheckCircle2 } from "lucide-react"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 bg-[#F0F6FF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <MotionWrapper>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] border border-[#378ADD]/20 bg-[#378ADD]/5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#378ADD]" />
            <span className="text-xs font-semibold text-[#185FA5] tracking-wide">
              Now Managing 80,000+ Appointments
            </span>
          </div>
        </MotionWrapper>

        <MotionWrapper delay={0.1}>
          <h1 className="text-[40px] md:text-[48px] font-bold tracking-tight text-gray-900 leading-[1.1]">
            Run Your Clinic{" "}
            <span className="text-[#378ADD]">Smarter</span>
          </h1>
        </MotionWrapper>

        <MotionWrapper delay={0.2}>
          <p className="mt-6 text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Everything your clinic needs. Patients, appointments, invoices, waiting room, and online booking — all in one elegant system.
          </p>
        </MotionWrapper>

        <MotionWrapper delay={0.3}>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-medium text-white px-5 py-2.5 rounded-[8px] bg-[#378ADD] hover:bg-[#2e7ac7] transition-colors shadow-sm"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a 
              href="https://wa.me/201275976195" 
              target="_blank"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-medium text-[#378ADD] px-5 py-2.5 rounded-[8px] border border-[#378ADD] bg-transparent hover:bg-[#F0F6FF] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.491 0 1.472 1.035 2.893 1.183 3.087.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Chat on WhatsApp
            </a>
            <button 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-700 px-5 py-2.5 rounded-[8px] border border-[#E5E7EB] bg-white hover:bg-gray-50 transition-colors"
            >
              <Play className="h-4 w-4 text-[#378ADD] fill-[#378ADD]" />
              Watch Demo
            </button>
          </div>
        </MotionWrapper>

        <MotionWrapper delay={0.4}>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#378ADD]" />
              No credit card required
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#378ADD]" />
              Upgrade anytime
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#378ADD]" />
              Arabic support
            </div>
          </div>
        </MotionWrapper>

        {/* Dashboard Image Placeholder */}
        <MotionWrapper delay={0.5} className="mt-16">
          <div className="bg-white p-1.5 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E5E7EB] max-w-5xl mx-auto">
            <div className="bg-gray-50 rounded-[8px] overflow-hidden border border-[#E5E7EB]">
              <div className="h-8 bg-white border-b border-[#E5E7EB] flex items-center px-3 gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#EF6B6B]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#F4B860]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#6BCB77]" />
                <div className="ml-3 h-4 w-48 rounded bg-gray-100" />
              </div>
              {/* Replace src with your actual dashboard image */}
              <img 
                src="/dashboard-preview.png" 
                alt="Eyadti Dashboard Preview" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </MotionWrapper>
      </div>
    </section>
  )
}