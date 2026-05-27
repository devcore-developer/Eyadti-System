// src/app/(dashboard)/patients/[id]/prescriptions/[prescriptionId]/print/page.tsx

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getPrescriptionById } from "@/lib/actions/prescriptions"
import { notFound } from "next/navigation"
import { PrintPrescriptionView } from "@/components/prescriptions/print-prescription-view"

export const dynamic = "force-dynamic"

export default async function PrintPrescriptionPage({
  params,
}: {
  params: Promise<{ id: string; prescriptionId: string }>
}) {
  const { id: patientId, prescriptionId } = await params

  const session = await auth()
  if (!session?.user) {
    notFound()
  }

  const [rx, clinic] = await Promise.all([
    getPrescriptionById(prescriptionId, session.user.clinicId),
    prisma.clinic.findUnique({
      where: { id: session.user.clinicId },
      select: { name: true, phone: true, address: true },
    }),
  ])

  if (!rx || rx.patientId !== patientId) {
    notFound()
  }

  return (
    <PrintPrescriptionView 
      prescription={rx as any} 
      clinic={clinic} 
    />
  )
}