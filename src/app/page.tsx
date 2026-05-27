// src/app/page.tsx
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function RootPage() {
  const session = await auth()

  // لو مسجل دخول، روح للداشبورد، لو لا روح للوجين
  if (session) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}