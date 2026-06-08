import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth" // ← التعديل هنا لدعم NextAuth v5
import { WaitingRoomClient } from "@/components/waiting-room/waiting-room-client"
import { AppointmentStatus } from "@prisma/client"

export const dynamic = 'force-dynamic'

export default async function WaitingRoomPage() {
  const session = await auth() // ← التعديل هنا
  if (!session?.user) return null

  const clinicId = (session.user as any).clinicId

  // جلب المواعيد اللي في غرفة الانتظار حالياً
  const waitingAppointments = await prisma.appointment.findMany({
    where: {
      clinicId,
      status: { in: [AppointmentStatus.ARRIVED, AppointmentStatus.IN_PROGRESS] },
      dateTime: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)), // مواعيد اليوم بس
      }
    },
    include: {
      patient: { select: { fullName: true, phone: true } },
      doctor: { select: { name: true } },
    },
    orderBy: { dateTime: "asc" } // رتبنا بالوقت عشان arrivedAt ممكن يكون لسه null
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Waiting Room</h1>
        <div className="text-sm text-gray-500">
          {waitingAppointments.length} patients waiting
        </div>
      </div>

      <WaitingRoomClient appointments={waitingAppointments} />
    </div>
  )
}