// app/(dashboard)/page.tsx
import { redirect } from "next/navigation"

// ✨ السطر السحري: بيمنع الـ Next.js إنه يعمل Static Optimization للصفحة دي
// وبيجبره يولد الـ manifest files بشكل صحيح على الـ Vercel
export const dynamic = "force-dynamic"

export default function DashboardRootPage() {
  // توجيه اليوزر مباشرة لصفحة الداشبورد الرئيسية
  redirect("/dashboard")
}