import { redirect } from "next/navigation"

export default function NewPatientPage() {
  // تحويل تلقائي للرابط الموحد الجديد
  redirect("/reception/new")
}