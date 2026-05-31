import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import { getAttachmentsByPatientId } from "@/lib/actions/attachments"
import { AttachmentList } from "@/components/attachments/attachment-list"
import { AttachmentUpload } from "@/components/attachments/attachment-upload"

export default async function AttachmentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) redirect("/dashboard")

  const { id: patientId } = await params

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId: session.user.clinicId },
    select: { id: true, fullName: true },
  })
  if (!patient) notFound()

  const attachments = await getAttachmentsByPatientId(patientId, session.user.clinicId)
  const canUpload = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "DOCTOR" || session.user.role === "RECEPTIONIST"
  const canDelete = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "DOCTOR"

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/patients/${patientId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="mr-1 h-3 w-3" /> Back to {patient.fullName}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Medical Files</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {patient.fullName} • {attachments.length} file{attachments.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canUpload && <AttachmentUpload patientId={patientId} />}
      </div>

      <div className="glass-card rounded-xl p-6">
        <AttachmentList attachments={attachments} canDelete={canDelete} />
      </div>
    </div>
  )
}