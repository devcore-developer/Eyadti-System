"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export type ClinicServiceItem = {
  id: string
  name: string
  price: number
  category: string | null
}

export async function getClinicServices(clinicId: string): Promise<ClinicServiceItem[]> {
  const session = await auth()
  if (!session?.user) return []

  const services = await prisma.clinicService.findMany({
    where: { clinicId, isActive: true },
    select: { id: true, name: true, price: true, category: true },
    orderBy: { sortOrder: "asc" },
  })

  return services.map(s => ({
    id: s.id,
    name: s.name,
    price: Number(s.price),
    category: s.category,
  }))
}

export async function createClinicService(data: {
  clinicId: string
  name: string
  price: number
  category?: string
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return { success: false, error: "Only admins can manage services" }
  }

  try {
    await prisma.clinicService.create({
      data: {
        clinicId: data.clinicId,
        name: data.name,
        price: data.price,
        category: data.category || null,
      },
    })
    return { success: true }
  } catch (error: any) {
    if (error.code === "P2002") return { success: false, error: "A service with this name already exists" }
    return { success: false, error: "Failed to create service" }
  }
}