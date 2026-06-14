import { redirect } from "next/navigation"

export default async function NewVisitRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // ✨ تحويل المستخدم لصفحة المواعيد لإنشاء Walk-in بدلاً من زيارة حرة
  // هذا يضمن المرور بغرفة الانتظار والـ Queue System
  redirect(`/appointments?patientId=${id}&type=WALK_IN`)
}