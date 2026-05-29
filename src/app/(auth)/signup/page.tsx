"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { signupAction } from "@/actions/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Stethoscope, Loader2, AlertCircle, KeyRound, MessageCircle } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  
  // State للخطوتين
  const [step, setStep] = useState(1) // 1: بيانات، 2: كود التسجيل
  const [formData, setFormData] = useState({ name: "", email: "", password: "", clinicName: "" })
  const [signupCode, setSignupCode] = useState("")

  // لينك الواتساب بالرسالة الجاهزة
  const whatsappLink = "https://wa.me/201275976195?text=مرحباً، أريد الاشتراك في نظام عيادتي والحصول على كود التسجيل، أرجو تزويدي بالتفاصيل."

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validation بسيط للخطوة الأولى
    if (!formData.name || !formData.email || !formData.password || !formData.clinicName) {
      setError("Please fill in all fields")
      return
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setStep(2)
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!signupCode) {
      setError("Please enter the signup code")
      return
    }

    startTransition(async () => {
      const result = await signupAction({ ...formData, signupCode })
      if (result?.error) {
        setError(result.error)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-[#F0F8FF] dark:from-[#17212F] dark:to-[#0F172A] p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF] shadow-[0_15px_30px_rgba(107,156,255,0.25)] mb-4">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Create your clinic
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {step === 1 ? "Set up your account details" : "Enter your signup code to continue"}
          </p>
        </div>

        {/* Signup Card */}
        <div className="premium-card p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-800/30">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Step 1: User Data ── */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="Dr. Ahmed" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required disabled={isPending} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="doctor@clinic.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required disabled={isPending} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength={8} disabled={isPending} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic Name</Label>
                <Input id="clinicName" name="clinicName" placeholder="Eyadti Medical Center" value={formData.clinicName} onChange={(e) => setFormData({...formData, clinicName: e.target.value})} required disabled={isPending} />
              </div>

              <Button type="submit" className="w-full gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_8px_20px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 rounded-xl py-3 text-sm font-semibold mt-2">
                Continue to Verification
              </Button>
            </form>
          )}

          {/* ── Step 2: Signup Code & WhatsApp ── */}
          {step === 2 && (
            <form onSubmit={handleSignup} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              
              {/* رسالة تواصل مع الادمن */}
              <div className="bg-slate-50 dark:bg-[#223247]/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  You need a signup code to create your account. Contact the administrator to get yours.
                </p>
                <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#20bd5a] transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  Contact Admin via WhatsApp
                </a>
              </div>

              {/* حقل كود التسجيل */}
              <div className="space-y-2">
                <Label htmlFor="signupCode" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-[#5BC0BE]" />
                  Signup Code
                </Label>
                <Input 
                  id="signupCode" 
                  name="signupCode" 
                  placeholder="Enter the code you received" 
                  required 
                  disabled={isPending}
                  value={signupCode}
                  onChange={(e) => setSignupCode(e.target.value)}
                  className="font-semibold tracking-wider text-center"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl py-3"
                  disabled={isPending}
                >
                  Back
                </Button>

                <Button 
                  type="submit" 
                  className="flex-1 gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_8px_20px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 rounded-xl py-3 text-sm font-semibold"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Login Link */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-[#6B9CFF] font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}