"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { signupAction } from "@/actions/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Stethoscope, Loader2, AlertCircle, KeyRound, MessageCircle, ShieldCheck } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  
  const [formData, setFormData] = useState({ name: "", email: "", password: "", clinicName: "" })
  const [signupCode, setSignupCode] = useState("")

  const whatsappLink = "https://wa.me/201275976195?text=مرحباً، أريد الاشتراك في نظام عيادتي والحصول على كود التسجيل، أرجو تزويدي بالتفاصيل."

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.clinicName) {
      setError("Please fill in all required fields")
      return
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    startTransition(async () => {
      // الإرسال للـ Action، الكود سيكون اختياري
      const result = await signupAction({ ...formData, signupCode: signupCode || "" }) // ← أبعت نص فاضي بدل undefined
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
            Start Your Free Trial
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            10-day free trial. No credit card required.
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

          <form onSubmit={handleSignup} className="space-y-4">
            {/* User Data */}
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

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#1A2332] px-2 text-muted-foreground">Optional</span>
              </div>
            </div>

            {/* Activation Code (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="signupCode" className="flex items-center gap-2 text-sm">
                <KeyRound className="h-3.5 w-3.5 text-[#5BC0BE]" />
                Activation Code
              </Label>
              <Input 
                id="signupCode" 
                name="signupCode" 
                placeholder="Enter code if you have one" 
                disabled={isPending}
                value={signupCode}
                onChange={(e) => setSignupCode(e.target.value)}
                className="font-semibold tracking-wider text-center"
              />
              <p className="text-[11px] text-muted-foreground text-center">
                Leave empty to start with the 10-day Starter trial
              </p>
            </div>

            {/* WhatsApp Help */}
            <div className="bg-slate-50 dark:bg-[#223247]/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 text-center">
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#25D366] hover:text-[#20bd5a] transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Need a Pro code? Contact Sales via WhatsApp
              </a>
            </div>

            <Button 
              type="submit" 
              className="w-full gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_8px_20px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 rounded-xl py-3 text-sm font-semibold mt-2"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Start Free Trial
                </>
              )}
            </Button>
          </form>
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