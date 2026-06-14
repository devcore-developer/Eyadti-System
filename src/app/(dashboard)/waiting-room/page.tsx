import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { QueueCard } from "@/components/waiting-room/queue-card"
import { VisitStatus, Priority } from "@prisma/client"

export default async function WaitingRoomPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) redirect("/dashboard")

  // جلب الزيارات النشطة فقط (اللي لسه مخلصتش)
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
      { priority: "desc" }, // الطوارئ أولاً
      { queueNumber: "asc" }, // ثم بالدور
    ],
  })

  const serializedVisits = activeVisits.map(v => ({
    id: v.id,
    queueNumber: v.queueNumber,
    patientId: v.patientId,       // ✨ إضافة لتمريرها لنافذة الفوترة
    doctorId: v.doctorId,         // ✨ إضافة لتمريرها لنافذة الفوترة
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
    <div className="space-y-6 animate-fade pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Waiting Room</h1>
          <p className="text-muted-foreground">Patients currently inside the clinic</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold text-yellow-700">{waitingCount}</p>
            <p className="text-xs text-yellow-600">Waiting</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold text-green-700">{withDoctorCount}</p>
            <p className="text-xs text-green-600">With Doctor</p>
          </div>
        </div>
      </div>

      {serializedVisits.length === 0 ? (
        <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-2xl">
          No patients in the waiting room right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serializedVisits.map(visit => (
            <QueueCard 
              key={visit.id} 
              id={visit.id}
              queueNumber={visit.queueNumber}
              patientName={visit.patientName}
              patientId={visit.patientId}       // ✨ تمرير الـ Prop
              doctorId={visit.doctorId}         // ✨ تمرير الـ Prop
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