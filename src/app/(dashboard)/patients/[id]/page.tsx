// src/app/(dashboard)/patients/[id]/page.tsx
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { PatientDeleteButton } from "@/components/patients/patient-delete-button"
import { ActivityTimeline } from "@/components/audit/activity-timeline"
import { getEntityTimeline } from "@/lib/actions/audit"
import { EmptyState } from "@/components/shared/empty-state"
import { ArrowLeft, Stethoscope, Pencil, CalendarDays, FileText, Pill, History, Upload, Activity, Phone, Mail, MapPin, Clock, ImagePlus } from "lucide-react"
import { PatientProfileHeader } from "@/components/patients/patient-profile-header"
import { PatientSummaryCards } from "@/components/patients/patient-summary-cards"
import { PatientTabs } from "@/components/patients/patient-tabs"
import { getPatientGallery } from "@/actions/gallery"
import { PatientGallery } from "@/components/patients/patient-gallery"

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  let session
  try {
    session = await requireRole("SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST")
  } catch (error) {
    if ((error as any)?.name === "AuthenticationError") redirect("/login")
    if ((error as any)?.name === "AuthorizationError") redirect("/dashboard")
    throw error
  }

  const { id } = await params

  // ━━━━ جلب بيانات العيادة (الاسم من Clinics واللوجو من ClinicSettings) ━━━━
  const [patient, timeline, galleryItems, clinic] = await Promise.all([
    prisma.patient.findFirst({
      where: { id: id, clinicId: session.clinicId },
      include: {
        _count: { select: { visits: true, prescriptions: true, attachments: true, invoices: true } },
        visits: {
          take: 3,
          orderBy: { visitDate: "desc" },
          include: { doctor: { select: { name: true } }, _count: { select: { complaints: true } } },
        },
        attachments: {
          take: 4,
          orderBy: { createdAt: "desc" },
          include: { uploadedBy: { select: { name: true } } },
        },
        prescriptions: {
          take: 4,
          orderBy: { createdAt: "desc" },
          include: { doctor: { select: { name: true } }, _count: { select: { items: true } } },
        },
      },
    }),
    getEntityTimeline("PATIENT", id),
    getPatientGallery(id),
    // استعلام العيادة والـ Settings
    session.clinicId ? prisma.clinic.findUnique({
      where: { id: session.clinicId },
      select: { 
        name: true, 
        settings: { 
          select: { logoUrl: true, clinicName: true } 
        } 
      }
    }) : Promise.resolve(null)
  ])

  if (!patient) notFound()

  const showEdit = session.role === "ADMIN" || session.role === "DOCTOR"
  const showDelete = session.role === "ADMIN"
  const canAddVisit = session.role === "ADMIN" || session.role === "DOCTOR"
  const canUpload = session.role === "ADMIN" || session.role === "DOCTOR" || session.role === "RECEPTIONIST"

  function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "—"
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return "—"
      return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(d)
    } catch { return "—" }
  }

  function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return "—"
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return "—"
      return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).format(d)
    } catch { return "—" }
  }

  function genderLabel(g: string | null): string {
    if (!g) return "—"
    return g === "MALE" ? "Male" : g === "FEMALE" ? "Female" : "Other"
  }

  const calculateAge = (dob: Date | null) => {
    if (!dob) return 0
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  return (
    <div className="space-y-8 animate-fade pb-10">
      {/* Back Navigation */}
      <div>
        <Link href="/patients" className="inline-flex items-center text-sm text-muted-foreground hover:text-[#6B9CFF] transition-colors mb-2">
          <ArrowLeft className="mr-1 h-3 w-3" /> Back to Patients
        </Link>
      </div>

      <PatientProfileHeader 
        name={patient.fullName}
        patientId={patient.id.substring(0, 8).toUpperCase()}
        age={calculateAge(patient.dateOfBirth)}
        gender={genderLabel(patient.gender)}
        phone={patient.phone || "—"}
        email={patient.email || undefined}
        lastVisit={patient.visits.length > 0 ? formatDateTime(patient.visits[0].visitDate) : "No visits yet"}
      />

      {/* ── Action Buttons Row ── */}
      <div className="flex flex-wrap items-center gap-3 -mt-4">
        {canAddVisit && (
          <Link href={`/patients/${patient.id}/visits/new`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(107,156,255,0.20)] hover:-translate-y-0.5 transition-all duration-200">
            <Stethoscope className="h-4 w-4" /> New Visit
          </Link>
        )}
        {canAddVisit && (
          <Link href={`/patients/${patient.id}/prescriptions/new`} className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] px-5 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <Pill className="h-4 w-4 text-[#6B9CFF]" /> Prescription
          </Link>
        )}
        {canUpload && (
          <Link href={`/patients/${patient.id}/attachments`} className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-[#223247] border border-dashed border-[rgba(148,163,184,0.2)] dark:border-[rgba(255,255,255,0.1)] px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-[#5BC0BE] hover:border-[#5BC0BE]/50 transition-all duration-200">
            <Upload className="h-4 w-4" /> Upload File
          </Link>
        )}
        <div className="flex-1"></div>
        {showEdit && <Link href={`/patients/edit/${patient.id}`} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"><Pencil className="h-3.5 w-3.5" /> Edit</Link>}
        {showDelete && <PatientDeleteButton patientId={patient.id} patientName={patient.fullName} />}
      </div>

      <PatientSummaryCards visits={patient._count.visits} prescriptions={patient._count.prescriptions} invoices={patient._count.invoices} outstanding={0} />

      <div className="p-6 md:p-8 rounded-[24px] bg-gradient-to-br from-white/95 to-[#F0F8FF]/95 dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_15px_35px_rgba(100,116,139,0.10)]">
        <PatientTabs>
          <div className="space-y-12 mt-2">
            
            {/* ── Overview Section ── */}
            <div id="overview">
              <h2 className="text-xl font-semibold text-foreground mb-6">Patient Overview</h2>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="p-6 rounded-[20px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_8px_20px_rgba(100,116,139,0.06)] space-y-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Information</h3>
                  <dl className="space-y-4">
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Activity className="h-4 w-4 text-[#5BC0BE]" /> Full Name</dt><dd className="text-sm font-medium text-foreground">{patient.fullName}</dd></div>
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4 text-[#6B9CFF]" /> Phone</dt><dd className="text-sm font-medium text-foreground">{patient.phone || "—"}</dd></div>
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4 text-[#89D6D2]" /> Email</dt><dd className="text-sm font-medium text-foreground">{patient.email || "—"}</dd></div>
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4 text-[#F4B860]" /> Date of Birth</dt><dd className="text-sm font-medium text-foreground">{formatDate(patient.dateOfBirth)}</dd></div>
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Activity className="h-4 w-4 text-[#5BC0BE]" /> Gender</dt><dd className="text-sm font-medium text-foreground">{genderLabel(patient.gender)}</dd></div>
                  </dl>
                </div>
                <div className="p-6 rounded-[20px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_8px_20px_rgba(100,116,139,0.06)] space-y-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional Information</h3>
                  <dl className="space-y-4">
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-[#EF6B6B]" /> Address</dt><dd className="text-sm text-right max-w-[60%] font-medium text-foreground">{patient.address || "—"}</dd></div>
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4 text-[#6B9CFF]" /> Registered On</dt><dd className="text-sm font-medium text-foreground">{formatDate(patient.createdAt)}</dd></div>
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><History className="h-4 w-4 text-[#89D6D2]" /> Last Updated</dt><dd className="text-sm font-medium text-foreground">{formatDate(patient.updatedAt)}</dd></div>
                  </dl>
                </div>
              </div>
            </div>

            {/* ── Recent Visits Section ── */}
            <div id="visits">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Recent Visits</h2>
                <div className="flex items-center gap-3">
                  {canAddVisit && <Link href={`/patients/${patient.id}/visits/new`} className="text-sm font-semibold text-[#5BC0BE] hover:underline">+ New Visit</Link>}
                  <Link href={`/patients/${patient.id}/visits`} className="text-sm font-semibold text-[#6B9CFF] hover:underline">View all →</Link>
                </div>
              </div>
              {patient.visits.length === 0 ? <EmptyState icon={Stethoscope} title="No visits yet" description="No medical visits recorded for this patient." /> : (
                <div className="space-y-3">
                  {patient.visits.map((visit: any) => (
                    <Link key={visit.id} href={`/patients/${patient.id}/visits/${visit.id}`} className="group flex items-center justify-between p-5 rounded-[18px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.05)] dark:border-[rgba(255,255,255,0.03)] hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(100,116,139,0.10)] transition-all duration-200 cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5BC0BE]/10"><Stethoscope className="h-5 w-5 text-[#5BC0BE]" /></div>
                        <div><p className="text-sm font-semibold text-foreground">Dr. {visit.doctor.name}</p><p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(visit.visitDate)}</p></div>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-[#5BC0BE]/10 px-3 py-1 text-xs font-semibold text-[#5BC0BE]">{visit._count.complaints} Complaint{visit._count.complaints !== 1 ? "s" : ""}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ── Recent Prescriptions Section ── */}
            <div id="prescriptions">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Prescriptions</h2>
                <div className="flex items-center gap-3">
                  {canAddVisit && <Link href={`/patients/${patient.id}/prescriptions/new`} className="text-sm font-semibold text-[#6B9CFF] hover:underline">+ New Rx</Link>}
                  <Link href={`/patients/${patient.id}/prescriptions`} className="text-sm font-semibold text-[#6B9CFF] hover:underline">View all →</Link>
                </div>
              </div>
              {patient.prescriptions.length === 0 ? <EmptyState icon={Pill} title="No prescriptions" description="No prescriptions recorded for this patient yet." /> : (
                <div className="space-y-3">
                  {patient.prescriptions.map((rx: any) => (
                    <Link key={rx.id} href={`/patients/${patient.id}/prescriptions/${rx.id}`} className="group flex items-center justify-between p-5 rounded-[18px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.05)] dark:border-[rgba(255,255,255,0.03)] hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(100,116,139,0.10)] transition-all duration-200 cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6B9CFF]/10"><Pill className="h-5 w-5 text-[#6B9CFF]" /></div>
                        <div><p className="text-sm font-semibold text-foreground">Dr. {rx.doctor.name}</p><p className="text-xs text-muted-foreground mt-0.5">{formatDate(rx.createdAt)}</p></div>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-[#6B9CFF]/10 px-3 py-1 text-xs font-semibold text-[#6B9CFF]">{rx._count.items} Med{rx._count.items !== 1 ? "s" : ""}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ── Recent Attachments Section ── */}
            <div id="attachments">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Medical Files</h2>
                <div className="flex items-center gap-3">
                  {canUpload && <Link href={`/patients/${patient.id}/attachments`} className="text-sm font-semibold text-[#5BC0BE] hover:underline">Upload →</Link>}
                  <Link href={`/patients/${patient.id}/attachments`} className="text-sm font-semibold text-[#6B9CFF] hover:underline">View all →</Link>
                </div>
              </div>
              {patient.attachments.length === 0 ? <EmptyState icon={FileText} title="No files" description="No medical files uploaded for this patient yet." /> : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {patient.attachments.map((att: any) => (
                    <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-[18px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.05)] dark:border-[rgba(255,255,255,0.03)] hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(100,116,139,0.10)] transition-all duration-200">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#89D6D2]/10"><FileText className="h-5 w-5 text-[#89D6D2]" /></div>
                      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-foreground truncate">{att.fileName}</p><p className="text-xs text-muted-foreground mt-0.5">{formatDate(att.createdAt)} • {att.uploadedBy.name}</p></div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* ━━━ Before & After Gallery Section ━━━ */}
            <div id="gallery">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <ImagePlus className="h-5 w-5 text-[#5BC0BE]" />
                  Before & After Gallery
                </h2>
              </div>
              {/* تمرير اللوجو من الـ settings والاسم من الـ clinic أو الـ settings */}
              <PatientGallery 
                patientId={id} 
                items={galleryItems} 
                clinicLogo={clinic?.settings?.logoUrl} 
                clinicName={clinic?.name || clinic?.settings?.clinicName} 
              />
            </div>

            {/* ── Activity Timeline Section ── */}
            <div id="timeline">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Activity Timeline</h2>
                <Link href={`/admin/audit-logs?entityType=PATIENT&search=${patient.id}`} className="text-sm font-semibold text-[#6B9CFF] hover:underline">View Full Log →</Link>
              </div>
              <div className="p-6 rounded-[20px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_8px_20px_rgba(100,116,139,0.06)]">
                <ActivityTimeline logs={timeline as any} />
              </div>
            </div>

          </div>
        </PatientTabs>
      </div>
    </div>
  )
}