import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { PatientDeleteButton } from "@/components/patients/patient-delete-button"
import { ActivityTimeline } from "@/components/audit/activity-timeline"
import { getEntityTimeline } from "@/lib/actions/audit"
import { EmptyState } from "@/components/shared/empty-state"
import { ArrowLeft, Stethoscope, Pencil, CalendarDays, FileText, Pill, History, Upload, Activity, Phone, Mail, MapPin, Clock, ImagePlus, Receipt } from "lucide-react"
import { PatientProfileHeader } from "@/components/patients/patient-profile-header"
import { PatientSummaryCards } from "@/components/patients/patient-summary-cards"
import { getPatientGallery } from "@/actions/gallery"
import { PatientGallery } from "@/components/patients/patient-gallery"
import { PatientHistorySection } from "@/components/patients/patient-history-section"
import { PatientTabs } from "@/components/patients/patient-tabs"

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  let session
  try {
    session = await requireRole("SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST")
  } catch (error) {
    if ((error as any)?.name === "AuthenticationError") redirect("/login")
    if ((error as any)?.name === "AuthorizationError") redirect("/dashboard")
    throw error
  }

  const { id } = await params

  const [patient, timeline, galleryItems, clinic] = await Promise.all([
    prisma.patient.findFirst({
      where: { id: id, clinicId: session.clinicId },
      include: {
        _count: { select: { visits: true, prescriptions: true, attachments: true, invoices: true } },
        visits: { take: 3, orderBy: { visitDate: "desc" }, include: { doctor: { select: { name: true } }, _count: { select: { complaints: true } } } },
        attachments: { take: 4, orderBy: { createdAt: "desc" }, include: { uploadedBy: { select: { name: true } } } },
        ...(session.role === "SUPER_ADMIN" || session.role === "ADMIN" || session.role === "DOCTOR" ? {
          prescriptions: { take: 4, orderBy: { createdAt: "desc" }, include: { doctor: { select: { name: true } }, _count: { select: { items: true } } } },
        } : {}),
        allergies: { orderBy: { createdAt: "desc" } },
        medicalHistory: { orderBy: { createdAt: "desc" } },
        surgicalHistory: { orderBy: { createdAt: "desc" } },
      },
    }),
    getEntityTimeline("PATIENT", id),
    getPatientGallery(id),
    session.clinicId ? prisma.clinic.findUnique({ where: { id: session.clinicId }, select: { name: true, settings: { select: { logoUrl: true, clinicName: true } } } }) : Promise.resolve(null)
  ])

  if (!patient) notFound()

  const isMedical = session.role === "SUPER_ADMIN" || session.role === "ADMIN" || session.role === "DOCTOR"
  const isBilling = session.role === "SUPER_ADMIN" || session.role === "ADMIN" || session.role === "RECEPTIONIST"
  const showEdit = isMedical
  const showDelete = session.role === "SUPER_ADMIN" || session.role === "ADMIN"
  const canAddVisit = isMedical
  const canUpload = isMedical || session.role === "RECEPTIONIST"

  function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "—"
    try { const d = new Date(date); if (isNaN(d.getTime())) return "—"; return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(d) } catch { return "—" }
  }

  function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return "—"
    try { const d = new Date(date); if (isNaN(d.getTime())) return "—"; return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).format(d) } catch { return "—" }
  }

  function genderLabel(g: string | null): string {
    if (!g) return "—"
    return g === "MALE" ? "Male" : g === "FEMALE" ? "Female" : "Other"
  }

  const calculateAge = (dob: Date | null) => {
    if (!dob) return 0
    const today = new Date(); const birthDate = new Date(dob); let age = today.getFullYear() - birthDate.getFullYear(); const m = today.getMonth() - birthDate.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--; return age
  }

  return (
    // ✨ تقليل الـ Spacing وتأمين الـ Overflow
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade pb-10 min-w-0 overflow-hidden">
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

      {/* ✨ Action Buttons - ملء الشاشة على الموبايل */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 -mt-2">
        {canAddVisit && (
          <Link href={`/patients/${patient.id}/visits/new`} className="sm:inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 transition-all duration-200">
            <Stethoscope className="h-4 w-4" /> New Visit
          </Link>
        )}
        {isMedical && (
          <Link href={`/patients/${patient.id}/prescriptions/new`} className="sm:inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-[#223247] border px-5 py-2.5 text-sm font-semibold text-foreground hover:shadow-md transition-all">
            <Pill className="h-4 w-4 text-[#6B9CFF]" /> Prescription
          </Link>
        )}
        {canUpload && (
          <Link href={`/patients/${patient.id}/attachments`} className="sm:inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-[#223247] border border-dashed px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-[#5BC0BE] transition-all">
            <Upload className="h-4 w-4" /> Upload File
          </Link>
        )}
        <div className="flex-1 hidden sm:block"></div>
        <div className="flex gap-2 justify-end">
          {showEdit && <Link href={`/patients/edit/${patient.id}`} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"><Pencil className="h-3.5 w-3.5" /> Edit</Link>}
          {showDelete && <PatientDeleteButton patientId={patient.id} patientName={patient.fullName} />}
        </div>
      </div>

      <PatientSummaryCards visits={patient._count.visits} prescriptions={patient._count.prescriptions} invoices={patient._count.invoices} outstanding={0} />

      {/* ✨ تقليل الـ Padding للمحتوى الداخلي على الموبايل */}
      <div className="p-3 sm:p-6 md:p-8 rounded-[20px] sm:rounded-[24px] bg-gradient-to-br from-white/95 to-[#F0F8FF]/95 dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_10px_25px_rgba(100,116,139,0.08)] overflow-hidden">
        
        {/* Tab Navigation محذوف من هنا لأننا استخدمنا الـ Sticky Component */}
        <PatientTabs>
          <div className="space-y-8 md:space-y-12 mt-2">
            
            {/* Overview Section */}
            <div id="overview">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">Patient Overview</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="p-4 sm:p-6 rounded-[16px] sm:rounded-[20px] bg-white dark:bg-[#223247] border shadow-sm space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Information</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-muted-foreground"><Activity className="h-4 w-4 text-[#5BC0BE]" /> Full Name</dt><dd className="font-medium text-foreground truncate ml-2">{patient.fullName}</dd></div>
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 text-[#6B9CFF]" /> Phone</dt><dd className="font-medium text-foreground">{patient.phone || "—"}</dd></div>
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4 text-[#89D6D2]" /> Email</dt><dd className="font-medium text-foreground truncate ml-2">{patient.email || "—"}</dd></div>
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4 text-[#F4B860]" /> DOB</dt><dd className="font-medium text-foreground">{formatDate(patient.dateOfBirth)}</dd></div>
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-muted-foreground"><Activity className="h-4 w-4 text-[#5BC0BE]" /> Gender</dt><dd className="font-medium text-foreground">{genderLabel(patient.gender)}</dd></div>
                  </dl>
                </div>
                <div className="p-4 sm:p-6 rounded-[16px] sm:rounded-[20px] bg-white dark:bg-[#223247] border shadow-sm space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional Information</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-[#EF6B6B]" /> Address</dt><dd className="text-right max-w-[60%] font-medium text-foreground truncate ml-2">{patient.address || "—"}</dd></div>
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 text-[#6B9CFF]" /> Registered</dt><dd className="font-medium text-foreground">{formatDate(patient.createdAt)}</dd></div>
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-muted-foreground"><History className="h-4 w-4 text-[#89D6D2]" /> Updated</dt><dd className="font-medium text-foreground">{formatDate(patient.updatedAt)}</dd></div>
                  </dl>
                </div>
              </div>
              <PatientHistorySection patientId={patient.id} allergies={patient.allergies} medicalHistory={patient.medicalHistory} surgicalHistory={patient.surgicalHistory} />
            </div>

            {/* Visits Section */}
            <div id="visits">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Recent Visits</h2>
                <div className="flex items-center gap-3">
                  {canAddVisit && <Link href={`/patients/${patient.id}/visits/new`} className="text-sm font-semibold text-[#5BC0BE]">+ New</Link>}
                  <Link href={`/patients/${patient.id}/visits`} className="text-sm font-semibold text-[#6B9CFF]">View all →</Link>
                </div>
              </div>
              {patient.visits.length === 0 ? <EmptyState icon={Stethoscope} title="No visits yet" description="No medical visits recorded." /> : (
                <div className="space-y-2 sm:space-y-3">
                  {patient.visits.map((visit: any) => (
                    <Link key={visit.id} href={`/patients/${patient.id}/visits/${visit.id}`} className="group flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#223247] border hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-[#5BC0BE]/10 shrink-0"><Stethoscope className="h-5 w-5 text-[#5BC0BE]" /></div>
                        <div className="min-w-0"><p className="text-sm font-semibold text-foreground truncate">Dr. {visit.doctor.name}</p><p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(visit.visitDate)}</p></div>
                      </div>
                      {/* ✅ التعديل هنا: استخدام الـ Template Literals */}
                      <span className="inline-flex items-center rounded-full bg-[#5BC0BE]/10 px-2 sm:px-3 py-1 text-xs font-semibold text-[#5BC0BE] shrink-0 ml-2">{`${visit._count.complaints} Complaint${visit._count.complaints !== 1 ? "s" : ""}`}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Prescriptions Section */}
            {isMedical && (
              <div id="prescriptions">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">Prescriptions</h2>
                  <div className="flex items-center gap-3">
                    {canAddVisit && <Link href={`/patients/${patient.id}/prescriptions/new`} className="text-sm font-semibold text-[#6B9CFF]">+ New Rx</Link>}
                    <Link href={`/patients/${patient.id}/prescriptions`} className="text-sm font-semibold text-[#6B9CFF]">View all →</Link>
                  </div>
                </div>
                {(patient.prescriptions?.length ?? 0) === 0 ? <EmptyState icon={Pill} title="No prescriptions" description="No prescriptions recorded." /> : (
                  <div className="space-y-2 sm:space-y-3">
                    {patient.prescriptions?.map((rx: any) => (
                      <Link key={rx.id} href={`/patients/${patient.id}/prescriptions/${rx.id}`} className="group flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#223247] border hover:shadow-md transition-all cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-[#6B9CFF]/10 shrink-0"><Pill className="h-5 w-5 text-[#6B9CFF]" /></div>
                          <div className="min-w-0"><p className="text-sm font-semibold text-foreground truncate">Dr. {rx.doctor.name}</p><p className="text-xs text-muted-foreground mt-0.5">{formatDate(rx.createdAt)}</p></div>
                        </div>
                        {/* ✅ التعديل هنا: استخدام الـ Template Literals */}
                        <span className="inline-flex items-center rounded-full bg-[#6B9CFF]/10 px-2 sm:px-3 py-1 text-xs font-semibold text-[#6B9CFF] shrink-0 ml-2">{`${rx._count.items} Med${rx._count.items !== 1 ? "s" : ""}`}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Invoices Section */}
            {isBilling && (
              <div id="invoices">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-[#5BC0BE]" /> Invoices
                  </h2>
                  <Link href={`/invoices?patientId=${patient.id}`} className="text-sm font-semibold text-[#6B9CFF]">View all →</Link>
                </div>
                <EmptyState icon={Receipt} title="Invoice Management" description="Invoices for this patient are managed in the billing section." />
              </div>
            )}

            {/* Attachments & Gallery Section */}
            <div id="attachments">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Medical Files & Gallery</h2>
                <div className="flex items-center gap-3">
                  {canUpload && <Link href={`/patients/${patient.id}/attachments`} className="text-sm font-semibold text-[#5BC0BE]">Upload →</Link>}
                  <Link href={`/patients/${patient.id}/attachments`} className="text-sm font-semibold text-[#6B9CFF]">View all →</Link>
                </div>
              </div>
              {patient.attachments.length === 0 ? <EmptyState icon={FileText} title="No files" description="No medical files uploaded." /> : (
                <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 mb-8">
                  {patient.attachments.map((att: any) => (
                    <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#223247] border hover:shadow-md transition-all">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#89D6D2]/10"><FileText className="h-5 w-5 text-[#89D6D2]" /></div>
                      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-foreground truncate">{att.fileName}</p><p className="text-xs text-muted-foreground mt-0.5 truncate">{formatDate(att.createdAt)} • {att.uploadedBy.name}</p></div>
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <PatientGallery patientId={id} items={galleryItems} clinicLogo={clinic?.settings?.logoUrl} />
              </div>
            </div>

            {/* Activity Timeline Section */}
            <div id="timeline">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Activity Timeline</h2>
                <Link href={`/admin/audit-logs?entityType=PATIENT&search=${patient.id}`} className="text-sm font-semibold text-[#6B9CFF]">View Full Log →</Link>
              </div>
              <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#223247] border shadow-sm">
                <ActivityTimeline logs={timeline as any} />
              </div>
            </div>

          </div>
        </PatientTabs>
      </div>
    </div>
  )
}