import { redirect } from "next/navigation"

export default async function NewVisitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: patientId } = await params
  
  // تحويل للرابط الموحد وبعت الـ patientId كـ Query Parameter
  redirect(`/reception/new?patientId=${patientId}`)
}