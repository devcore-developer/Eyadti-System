import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

// ═════════════════════════════════════════════════════════════════
// ✅ FIX: هذه الصفحة لم تعد landing page
// يجب دائماً استخدام /book/[slug] مع slug العيادة المحدد
// ═════════════════════════════════════════════════════════════════
export default function BookRootPage() {
  // لا نعمل redirect لأي عيادة - نعرض 404
  // العيادة يجب أن تُحدد من الـ URL: /book/clinic-slug
  notFound()
}