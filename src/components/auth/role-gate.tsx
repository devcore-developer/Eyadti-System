"use client"

import { useSession } from "next-auth/react"

type Props = {
  children: React.ReactNode
  allowedRoles: string[] // الأدوار المسموح لها برؤية هذا المحتوى
}

export function RoleGate({ children, allowedRoles }: Props) {
  const { data: session } = useSession()
  const userRole = session?.user?.role

  if (!userRole || !allowedRoles.includes(userRole)) {
    return null // إخفاء المحتوى تماماً لو الدور غير مسموح
  }

  return <>{children}</>
}