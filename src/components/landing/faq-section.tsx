"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/i18n-context" // ⬅️ لازم يكون الملف Client

// ⬇️⬇️⬇️ باقي القاموس (نقلناه هنا عشان يبقى Server Component بس المتغيرات بتشتغل في Client) ⬇️⬇⬇️
const faqDictionary = {
  en: {
    "faq.q1": "What is Nexora?",
    "faq.a1": "Nexora is a comprehensive clinic management system designed for healthcare providers in the Middle East. It handles patient records, appointments, billing, prescriptions, online booking, WhatsApp notifications, and advanced analytics — all from one dashboard.",
    "faq.q2": "How does the free trial work?",
    "faq.a2": "When you sign up with an activation code, your clinic gets a 7-day trial period with full access to all features included in your selected plan. No credit card is required to start.",
    "faq.q3": "How long is the trial period?",
    "faq.a3": "The trial period is 7 days by default. During this time, you can explore all features, add patients, create appointments, and test the system thoroughly before committing to a paid plan.",
    "faq.q4": "Can I upgrade my plan later?",
    "faq.a4": "Absolutely. You can upgrade or downgrade your plan at any time from the Billing settings in your dashboard. If you upgrade mid-cycle, the price difference will be prorated automatically.",
    "faq.q5": "How do subscriptions work?",
    "faq.a5": "Nexora uses monthly or yearly billing cycles. You choose a plan that fits your clinic size, and your subscription renews automatically. You can cancel anytime — your data remains accessible until the end of your billing period.",
    "faq.q6": "Can I manage multiple branches?",
    "faq.a6": "Yes! The Professional and Enterprise plans support multiple branches. You can manage doctors, schedules, and patient queues for each branch from a single dashboard. Branch switching is instant.",
    "faq.q7": "Does Nexora support online booking?",
    "faq.a7": "Yes. Each clinic gets a unique booking link that you can share with patients via WhatsApp, SMS, or your website. Patients can book appointments 24/7 without calling the clinic.",
    "faq.q8": "Is patient data secure?",
    "faq.a8": "Security is a top priority. All data is encrypted in transit and at rest. We use PostgreSQL with SSL, and all file uploads are stored on Cloudinary's secure infrastructure. We comply with data protection best practices.",
    "faq.q9": "Does Nexora support WhatsApp?",
    "faq.a9": "Yes. Nexora integrates with UltraMsg to send automated appointment reminders, follow-up messages, and notifications directly to patients via WhatsApp. This reduces no-shows significantly.",
    "faq.q10": "Can I cancel my subscription anytime?",
    "faq.a10": "Yes, you can cancel your subscription at any time from the Billing settings. Your account will remain active until the end of the current billing period. No penalties or hidden fees.",
    "faq.q11": "How do I contact support?",
    "faq.a11": "You can reach us via WhatsApp at the number listed in your dashboard, or email us at support@nexora.app. We typically respond within a few hours during business days."
  },
  ar: {
    "faq.q1": "ما هو Nexora؟",
    "faq.a1": "Nexora هو نظام شامل لإدارة العيادات مصمم لمقدمي الرعاية الصحية في الشرق الأوسط. يتعامل مع سجلات المرضى والمواعيد والفواتير والوصفات الطبية والحجز عبر الإنترنت وإشعارات واتساب والتحليلات المتقدمة — كل ذلك من لوحة تحكم واحدة.",
    "faq.q2": "كيف تعمل الفترة التجريبية المجانية؟",
    "faq.a2": "عند التسجيل بكود تفعيل، تحصل عيادتك على فترة تجريبية مدتها 7 أيام مع وصول كامل إلى جميع الميزات المضمنة في خطتك المحدد. لا حاجة لبطاقة ائتمان للبدء.",
    "faq.q3": "كم مدة الفترة التجريبية؟",
    "faq.a3": "الفترة التجريبية هي 7 أيام بشكل افتراضي. خلال هذا الوقت، يمكنك استكشاف جميع الميزات وإضافة مرضى وإنشاء مواعيد واختبار النظام بشكل كامل قبل الالتزام بخطة مدفوعة.",
    "faq.q4": "هل يمكنني ترقية خطتي لاحقًا؟",
    "faq.a4": "بالتأكيد. يمكنك ترقية أو تخفيض خطتك في أي وقت من إعدادات الفوترة في لوحة التحكم الخاصة بك. إذا قمت بالترقية في منتصف الدورة، سيتم احتساب فرق السعر بشكل متناسب تلقائيًا.",
    "faq.q5": "كيف تعمل الاشتراكات؟",
    "faq.a5": "يستخدم Nexora دورات فواتير شهرية أو سنوية. تختار خطة تناسب حجم عيادتك، ويتجدد اشتراكك تلقائيًا. يمكنك الإلغاء في أي وقت — تظل بياناتك متاحة حتى نهاية فترة الفوترة.",
    "faq.q6": "هل يمكنني إدارة فروع متعددة؟",
    "faq.a6": "نعم! خطط الاحتراف والمؤسسات تدعم فروعًا متعددة. يمكنك إدارة الأطباء والجداول وقوائم انتظار المرضى لكل فرع من لوحة تحكم واحدة. تبديل الفروع فوري.",
    "faq.q7": "هل يدعم Nexora الحجز عبر الإنترنت؟",
    "faq.a7": "نعم. تحصل كل عيادة على رابط حجز فريد يمكنك مشاركته مع المرضى عبر واتساب أو الرسائل القصيرة أو موقعك الإلكتروني. يمكن للمرضى حجز مواعيد على مدار الساعة دون الاتصال بالعيادة.",
    "faq.q8": "هل بيانات المرضى آمنة؟",
    "faq.a8": "الأمان هو أولوية قصوى. جميع البيانات مشفرة أثناء النقل وفي حالة السكون. نستخدم PostgreSQL مع SSL، وتخزن جميع الملفات المحملة على البنية التحتية الآمنة لـ Cloudinary. نلتزم بأفضل ممارسات حماية البيانات.",
    "faq.q9": "هل يدعم Nexora واتساب؟",
    "faq.a9": "نعم. يتكامل Nexora مع UltraMsg لإرسال تذكيرات المواعيد الآلية ورسائل المتابعة والإشعارات مباشرة إلى المرضى عبر واتساب. هذا يقلل عدم الحضور بشكل كبير.",
    "faq.q10": "هل يمكنني إلغاء اشتراكي في أي وقت؟",
    "faq.a10": "نعم، يمكنك إلغاء اشتراكك في أي وقت من إعدادات الفوترة. سيظل حسابك نشطًا حتى نهاية فترة الفوترة الحالية. بدون عقوبات أو رسوم خفية.",
    "faq.q11": "كيف أتواصل مع الدعم؟",
    "faq.a11": "يمكنك التواصل معنا عبر واتساب على الرقم الموجود في لوحة التحكم الخاصة بك، أو أرسل لنا بريدًا إلكترونيًا على support@nexora.app. نرد عادة خلال بضع ساعات خلال أيام العمل."
  }
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { t, locale } = useLang() // ⬅️ الترجمة

  const faqKeys = Object.keys(faqDictionary.en).filter(k => k.startsWith("faq.q"))
  
  return (
    <div className="space-y-3">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
          {locale === "ar" ? "الأسئلة المتكررة" : "Frequently Asked Questions"}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {locale === "ar" ? "كل ما تحتاج معرفته عن Nexora" : "Everything you need to know about Nexora"}
        </p>
      </div>

      <div className="space-y-2">
        {faqKeys.map((qKey, index) => {
          const aKey = qKey.replace("faq.q", "faq.a")
          return (
            <motion.div
              key={index}
              initial={false}
              animate={{ backgroundColor: openIndex === index ? "hsl(var(--muted))" : "transparent" }}
              className="rounded-xl border border-border/50 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex items-center justify-between w-full p-5 text-start"
              >
                <span className="text-sm font-semibold pe-4">{t(qKey)}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t(aKey)}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}