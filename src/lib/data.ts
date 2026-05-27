// src/lib/data.ts
import "server-only"
import { cache } from "react"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

// بيانات العيادة الحالية (بيتم عمل Query ليها مرة واحدة بس لكل Request)
export const getCurrentClinic = cache(async () => {
  const session = await auth()
  if (!session?.user?.clinicId) return null

  return prisma.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: { id: true, name: true, phone: true, address: true },
  })
})

// المرضى التابعين للعيادة (للاستخدام في الفورمز)
export const getClinicPatients = cache(async () => {
  const session = await auth()
  if (!session?.user?.clinicId) return []

  return prisma.patient.findMany({
    where: { clinicId: session.user.clinicId },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  })
})

// الدكاترة التابعين للعيادة (للاستخدام في الفورمز)
export const getClinicDoctors = cache(async () => {
  const session = await auth()
  if (!session?.user?.clinicId) return []

  return prisma.user.findMany({
    where: { clinicId: session.user.clinicId, role: "DOCTOR" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
})