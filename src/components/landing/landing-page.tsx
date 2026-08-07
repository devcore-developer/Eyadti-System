import { Navbar } from "./navbar"
import { Hero } from "./hero"
import { MotionWrapper } from "./motion-wrapper"
import PricingSection from "./pricing-section"
import Link from "next/link"
import { FAQSection } from "./faq-section"
import { TestimonialsSection } from "./testimonials-section"
import { Users, CalendarDays, Clock, Globe, FileText, Receipt, Building2, BarChart3, Bell } from "lucide-react"
import { cookies } from "next/headers"

const featuresDictionary = {
  en: [
    { title: "Patient Management", description: "Comprehensive records, medical history, and attachments for every patient.", icon: Users },
    { title: "Smart Appointments", description: "Intelligent scheduling with conflict detection and reminders.", icon: CalendarDays },
    { title: "Waiting Room Queue", description: "Real-time queue management and TV display support.", icon: Clock },
    { title: "Online Booking", description: "Let patients book 24/7 via your custom booking link.", icon: Globe },
    { title: "Invoices & Billing", description: "Generate invoices, track payments, and manage taxes easily.", icon: Receipt },
    { title: "Prescriptions", description: "Create, print, and share digital prescriptions instantly.", icon: FileText },
    { title: "Branch Management", description: "Manage multiple clinics and branches from one dashboard.", icon: Building2 },
    { title: "Analytics Dashboard", description: "Actionable insights on revenue, patients, and doctor performance.", icon: BarChart3 },
    { title: "WhatsApp Notifications", description: "Automated reminders and follow-ups via WhatsApp & SMS.", icon: Bell },
  ],
  ar: [
    { title: "إدارة المرضى", description: "سجلات شاملة والتاريخ الطبي والمرفقات لكل مريض.", icon: Users },
    { title: "مواعيد ذكية", description: "جدولة ذكية مع اكتشاف التعارض والتذكيرات.", icon: CalendarDays },
    { title: "قائمة الانتظار", description: "إدارة قائمة الانتظار في الوقت الفعلي ودعم عرض التلفزيون.", icon: Clock },
    { title: "حجز أونلاين", description: "دع المرضى يحجزون على مدار الساعة عبر رابط الحجز الخاص بك.", icon: Globe },
    { title: "الفواتير والمحاسبة", description: "إنشاء فواتير وتتبع المدفوعات وإدارة الضرائب بسهولة.", icon: Receipt },
    { title: "الوصفات الطبية", description: "إنشاء وطباعة ومشاركة الوصفات الرقمية فوراً.", icon: FileText },
    { title: "إدارة الفروع", description: "إدارة عيادات وفروع متعددة من لوحة تحكم واحدة.", icon: Building2 },
    { title: "لوحة التحليلات", description: "رؤى قابلة للتنفيذ حول الإيرادات والمرضى وأداء الأطباء.", icon: BarChart3 },
    { title: "إشعارات واتساب", description: "تذكيرات ومتابعة تلقائية عبر واتساب والرسائل القصيرة.", icon: Bell },
  ]
}

const landingStrings = {
  en: {
    everythingYouNeed: "Everything you need to run your clinic",
    fromRecordsToBilling: "From patient records to billing, manage it all in one place.",
    startManaging: "Start Managing Your Clinic Professionally Today",
    joinHundreds: "Join hundreds of clinics already using Nexora to save time, reduce no-shows, and increase revenue.",
    startFreeTrial: "Start Free Trial",
    contactSales: "Contact Sales",
    professionalSystem: "Professional clinic management system. Streamline appointments, billing, and patient records.",
    product: "Product",
    legal: "Legal",
    contact: "Contact",
    features: "Features",
    pricing: "Pricing",
    faq: "FAQ",
    testimonials: "Testimonials",
    privacyPolicy: "Privacy Policy",
    termsConditions: "Terms & Conditions",
    builtWith: "Built with",
  },
  ar: {
    everythingYouNeed: "كل ما تحتاجه لإدارة عيادتك",
    fromRecordsToBilling: "من سجلات المرضى إلى الفواتير، أدِر كل شيء في مكان واحد.",
    startManaging: "ابدأ في إدارة عيادتك باحترافية اليوم",
    joinHundreds: "انضم إلى مئات العيادات التي تستخدم Nexora بالفعل لتوفير الوقت وتقليل عدم الحضور وزيادة الإيرادات.",
    startFreeTrial: "ابدأ فترة تجريبية مجانية",
    contactSales: "تواصل مع المبيعات",
    professionalSystem: "نظام إدارة عيادات احترافي. تبسيط المواعيد والفواتير وسجلات المرضى.",
    product: "المنتج",
    legal: "قانوني",
    contact: "تواصل",
    features: "المميزات",
    pricing: "الأسعار",
    faq: "الأسئلة الشائعة",
    testimonials: "آراء العملاء",
    privacyPolicy: "سياسة الخصوصية",
    termsConditions: "الشروط والأحكام",
    builtWith: "مبني باستخدام",
  }
}

// ⬇️⬇️⬇️ لاحظظ إنها Named Export مش Default Export ⬇️⬇️⬇️
export async function LandingPage() {
  const cookieStore = await cookies()
  const locale = cookieStore.get("nexora-lang")?.value === "ar" ? "ar" : "en"
  
  const t = (key: string) => landingStrings[locale][key as keyof typeof landingStrings.en] || key
  const features = featuresDictionary[locale]

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />
      <Hero />

      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionWrapper className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter">
              {t("everythingYouNeed")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("fromRecordsToBilling")}
            </p>
          </MotionWrapper>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <MotionWrapper key={feature.title} delay={i * 0.1}>
                <div className="premium-card p-6 h-full flex flex-col">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#5BC0BE]/20 to-[#6B9CFF]/20 flex items-center justify-center mb-4 text-[#6B9CFF]">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </MotionWrapper>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 md:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PricingSection locale={locale} />
        </div>
      </section>

      <TestimonialsSection />

      <section id="faq" className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FAQSection />
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <MotionWrapper>
            <div className="premium-card p-12 md:p-16 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#5BC0BE]/5 to-[#6B9CFF]/5" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">
                  {t("startManaging")}
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  {t("joinHundreds")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/signup" className="inline-flex items-center justify-center gap-2 font-semibold text-white px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] shadow-[0_15px_35px_rgba(107,156,255,0.3)] hover:-translate-y-0.5 transition-all">
                    {t("startFreeTrial")}
                  </Link>
                  <a href="https://wa.me/201275976195" target="_blank" className="inline-flex items-center justify-center gap-2 font-semibold text-foreground px-8 py-3.5 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                    {t("contactSales")}
                  </a>
                </div>
              </div>
            </div>
          </MotionWrapper>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 text-foreground mb-4">
                <img src="/icon.png" alt="Nexora" className="h-9 w-auto object-contain" />
                <span className="text-xl font-bold tracking-tight">Nexora</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                {t("professionalSystem")}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">{t("product")}</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t("features")}</a>
                <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t("pricing")}</a>
                <a href="#faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t("faq")}</a>
                <a href="#testimonials" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t("testimonials")}</a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">{t("legal")}</h4>
              <div className="space-y-2">
                <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t("privacyPolicy")}</Link>
                <Link href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t("termsConditions")}</Link>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">{t("contact")}</h4>
              <div className="space-y-2">
                <a href="mailto:support@nexora.app" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">support@nexora.app</a>
                <a href="https://wa.me/201275976195" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">WhatsApp Support</a>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Nexora. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("builtWith")}</span>
              <span className="font-semibold text-foreground">Next.js</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}