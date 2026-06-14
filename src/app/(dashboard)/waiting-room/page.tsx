import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { QueueCard } from "@/components/waiting-room/queue-card"
import { VisitStatus, Priority } from "@prisma/client"

export default async function WaitingRoomPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) redirect("/dashboard")

  const activeVisits = await prisma.visit.findMany({
    where: {
      clinicId: session.user.clinicId,
      status: { in: [VisitStatus.WAITING, VisitStatus.WITH_DOCTOR, VisitStatus.PROCEDURE, VisitStatus.BILLING] },
    },
    include: {
      patient: { select: { fullName: true } },
      doctor: { select: { name: true } },
      appointment: { select: { type: true } },
    },
    orderBy: [
      { priority: "desc" },
      { queueNumber: "asc" },
    ],
  })

  const serializedVisits = activeVisits.map(v => ({
    id: v.id,
    queueNumber: v.queueNumber,
    patientId: v.patientId,
    doctorId: v.doctorId,
    patientName: v.patient.fullName,
    doctorName: v.doctor.name,
    appointmentType: v.appointment?.type || "WALK_IN",
    priority: v.priority,
    status: v.status,
    checkedInAt: v.checkedInAt ? v.checkedInAt.toISOString() : null,
  }))

  const waitingCount = serializedVisits.filter(v => v.status === VisitStatus.WAITING).length
  const withDoctorCount = serializedVisits.filter(v => v.status === VisitStatus.WITH_DOCTOR).length

  return (
    // ✨ تقليل الـ spacing على الموبايل
    <div className="space-y-4 md:space-y-6 animate-fade pb-20 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Waiting Room</h1>
          <p className="text-sm text-muted-foreground">Patients currently inside the clinic</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-center flex-1 sm:flex-none">
            <p className="text-2xl font-bold text-yellow-700">{waitingCount}</p>
            <p className="text-xs text-yellow-600">Waiting</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center flex-1 sm:flex-none">
            <p className="text-2xl font-bold text-green-700">{withDoctorCount}</p>
            <p className="text-xs text-green-600">With Doctor</p>
          </div>
        </div>
      </div>

      {serializedVisits.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed rounded-2xl bg-white/50 dark:bg-[#223247]/50">
          No patients in the waiting room right now.
        </div>
      ) : (
        // ✨ استخدام Grid متناسب مع الكروت الطويلة
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {serializedVisits.map(visit => (
            <QueueCard 
              key={visit.id} 
              id={visit.id}
              queueNumber={visit.queueNumber}
              patientName={visit.patientName}
              patientId={visit.patientId}
              doctorId={visit.doctorId}
              doctorName={visit.doctorName}
              appointmentType={visit.appointmentType}
              priority={visit.priority}
              status={visit.status}
              checkedInAt={visit.checkedInAt ? new Date(visit.checkedInAt) : null} 
            />
          ))}
        </div>
      )}
    </div>
  )
}