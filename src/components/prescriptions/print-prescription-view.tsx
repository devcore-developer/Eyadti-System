// src/components/prescriptions/print-prescription-view.tsx

"use client"

import { useState, useEffect } from "react"
import { translateToArabic } from "@/lib/medical-dictionary-ar"

type PrescriptionFull = {
  id: string
  patientId: string
  doctorId: string
  createdAt: Date | string
  patient: { id: string; fullName: string; phone: string | null }
  doctor: { id: string; name: string }
  items: {
    id: string
    medicationName: string
    dosage: string
    frequency: string
    duration: string
    instructions: string | null
  }[]
  diagnoses?: string | null
}

type ClinicData = { name: string; phone: string | null; address: string | null }

interface PrintPrescriptionViewProps {
  prescription: PrescriptionFull
  clinic: ClinicData | null
}

function formatDate(date: Date | string): string {
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return "—"
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(d)
  } catch { return "—" }
}

function getDoctorTitle(name: string, lang: 'en' | 'ar'): string {
  const hasArabicChars = /[\u0600-\u06FF]/.test(name)
  if (lang === 'ar') return hasArabicChars ? "د. " : "Dr. "
  return "Dr. "
}

// ✅ المكون الداخلي اللي بيرسم الروشتة الواحدة
function PrescriptionPage({ prescription, clinic, lang, translatedData }: { prescription: PrescriptionFull; clinic: ClinicData | null; lang: 'en' | 'ar'; translatedData: { diagnoses: string[]; items: { frequency: string; duration: string; instructions: string }[] } }) {
  const isArabic = lang === 'ar'
  
  // لو لسه مترجمتش (أو إنجليزي)، نستخدم البيانات الأصلية
  let diagnosesList: string[] = isArabic && translatedData.diagnoses.length > 0 
    ? translatedData.diagnoses 
    : (prescription.diagnoses ? JSON.parse(prescription.diagnoses) : []);

  return (
    <div className="prescription-page" dir={lang} style={{ direction: isArabic ? 'rtl' : 'ltr', fontFamily: isArabic ? "'Cairo', sans-serif" : "'Inter', sans-serif" }}>
      <div className="watermark">℞</div>
      <div className="header">
        <h1>{clinic?.name || (isArabic ? "عيادة عيادتي" : "Eyadti Clinic")}</h1>
        <p>{[clinic?.phone, clinic?.address].filter(Boolean).join(" • ")}</p>
        <div className="rx-badge" style={{ [isArabic ? 'left' : 'right']: 40 }}>℞</div>
      </div>
      
      <div className="info-grid">
        <div className="info-box">
          <div className="info-label">{isArabic ? "بيانات المريض" : "Patient Information"}</div>
          <div className="info-value">{prescription.patient.fullName}</div>
          <div className="info-sub">{isArabic ? "هاتف: " : "Phone: "}{prescription.patient.phone || (isArabic ? "غير مسجل" : "—")}</div>
        </div>
        <div className="info-box right-box">
          <div className="info-label">{isArabic ? "بيانات الوصفة الطبية" : "Prescription Details"}</div>
          <div className="info-value">{getDoctorTitle(prescription.doctor.name, lang)}{prescription.doctor.name}</div>
          <div className="info-sub">{isArabic ? "التاريخ: " : "Date: "}{formatDate(prescription.createdAt)}</div>
        </div>
      </div>

      {diagnosesList.length > 0 && (
        <div className="diagnosis-section">
          <h2>{isArabic ? "التشخيص" : "Diagnosis"}</h2>
          <div className="diagnosis-tags">
            {diagnosesList.map((d, i) => (
              // ✅ هنا بنستخدم d مباشرة لأنها مجات مترجمة من الـ translatedData
              <span key={i} className="diagnosis-tag">{d}</span>
            ))}
          </div>
        </div>
      )}

      <div className="medications">
        <h2>{isArabic ? "الأدوية الموصوفة" : "Prescribed Medications"}</h2>
        <table>
          <thead>
            <tr>
              <th style={{ width: "5%" }}>#</th>
              <th style={{ width: "30%", textAlign: isArabic ? 'right' : 'left' }}>{isArabic ? "الدواء" : "Medication"}</th>
              <th style={{ width: "15%", textAlign: isArabic ? 'right' : 'left' }}>{isArabic ? "الجرعة" : "Dosage"}</th>
              <th style={{ width: "20%", textAlign: isArabic ? 'right' : 'left' }}>{isArabic ? "التكرار" : "Frequency"}</th>
              <th style={{ width: "15%", textAlign: isArabic ? 'right' : 'left' }}>{isArabic ? "المدة" : "Duration"}</th>
              <th style={{ width: "15%", textAlign: isArabic ? 'right' : 'left' }}>{isArabic ? "التعليمات" : "Notes"}</th>
            </tr>
          </thead>
          <tbody>
            {prescription.items.map((item, i) => (
              <tr key={item.id}>
                <td style={{ color: "#94a3b8" }}>{i + 1}</td>
                <td className="med-name">{item.medicationName}</td>
                <td>{item.dosage}</td>
                {/* ✅ هنا بنستخدم الـ translatedData اللي اتحسبت في الـ useEffect بدل ما ننادي الدالة الـ async هنا */}
                <td>{isArabic && translatedData.items[i] ? translatedData.items[i].frequency : item.frequency}</td>
                <td>{isArabic && translatedData.items[i] ? translatedData.items[i].duration : item.duration}</td>
                <td>{item.instructions ? <span className="instructions-text">{isArabic && translatedData.items[i] ? translatedData.items[i].instructions : item.instructions}</span> : (isArabic ? "—" : "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="footer-section">
        <div className="system-note">{isArabic ? "صادر من نظام عيادتي • " : "Generated by Eyadti System • "}{formatDate(new Date())}</div>
        <div className="signature-block">
          <div className="signature-line"></div>
          <div className="signature-name">{getDoctorTitle(prescription.doctor.name, lang)}{prescription.doctor.name}</div>
          <div className="signature-title">{isArabic ? "التوقيع" : "Signature"}</div>
        </div>
      </div>
    </div>
  )
}

// ✅ المكون الرئيسي للصفحة
export default function PrintPrescriptionView({ prescription, clinic }: PrintPrescriptionViewProps) {
  const [printCopies, setPrintCopies] = useState<{ en: boolean; ar: boolean }>({ en: true, ar: false })
  
  const [translatedData, setTranslatedData] = useState<{
    diagnoses: string[];
    items: { frequency: string; duration: string; instructions: string }[];
  }>({ diagnoses: [], items: [] });

  useEffect(() => {
    document.body.classList.add('printing-prescription');
    return () => {
      document.body.classList.remove('printing-prescription');
    };
  }, []);

  useEffect(() => {
    async function fetchTranslations() {
      if (!printCopies.ar) return;

      const translatedDiagnoses = await Promise.all(
        (prescription.diagnoses ? JSON.parse(prescription.diagnoses) : []).map(async (d: string) => {
          return await translateToArabic(d, 'diagnoses');
        })
      );

      const translatedItems = await Promise.all(
        prescription.items.map(async (item) => {
          return {
            frequency: await translateToArabic(item.frequency, 'frequency'),
            duration: await translateToArabic(item.duration, 'duration'),
            instructions: await translateToArabic(item.instructions, 'instructions'),
          };
        })
      );

      setTranslatedData({ diagnoses: translatedDiagnoses, items: translatedItems });
    }

    fetchTranslations();
  }, [printCopies.ar, prescription]);

  return (
    <>
      <style jsx global>{`
        /* كل الـ CSS القديم يفضل زي ما هو */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;600;700&display=swap');
        body { margin: 0; padding: 20px; background-color: #f8fafc; color: #1e293b; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .prescription-page { max-width: 800px; margin: 0 auto 40px; background: #ffffff; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border-radius: 12px; overflow: hidden; position: relative; page-break-after: always; }
        .prescription-page:last-child { page-break-after: auto; margin-bottom: 0; }
        .header { background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); color: white; padding: 32px 40px; position: relative; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 4px 0 0; opacity: 0.9; font-size: 14px; }
        .rx-badge { position: absolute; top: 50%; transform: translateY(-50%); font-size: 72px; font-weight: 800; font-family: serif; opacity: 0.2; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background-color: #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        .info-box { background: #ffffff; padding: 24px 40px; }
        .info-box.right-box { background: #f8fafc; }
        .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; margin-bottom: 8px; }
        .info-value { font-size: 16px; font-weight: 600; color: #0f172a; }
        .info-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
        .diagnosis-section { padding: 20px 40px; border-bottom: 1px solid #e2e8f0; background: #fcfffe; }
        .diagnosis-section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #0f766e; margin: 0 0 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .diagnosis-section h2::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
        .diagnosis-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .diagnosis-tag { background: #f0fdfa; color: #0f766e; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid #99f6e4; }
        .medications { padding: 32px 40px; }
        .medications h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #0f766e; margin: 0 0 20px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .medications h2::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
        table { width: 100%; border-collapse: collapse; }
        th { padding: 12px 16px; background: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
        td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; vertical-align: top; }
        tr:last-child td { border-bottom: none; }
        .med-name { font-weight: 600; color: #0f172a; }
        .instructions-text { color: #b45309; font-weight: 500; font-size: 13px; background: #fffbeb; padding: 4px 8px; border-radius: 4px; display: inline-block; }
        .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 300px; font-family: serif; font-weight: bold; color: rgba(15, 118, 110, 0.03); pointer-events: none; z-index: 0; }
        .footer-section { padding: 40px; display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 1; }
        .system-note { font-size: 11px; color: #94a3b8; }
        .signature-block { text-align: center; }
        .signature-line { width: 200px; border-top: 1px dashed #cbd5e1; margin-bottom: 8px; padding-top: 40px; }
        .signature-name { font-weight: 600; color: #0f172a; font-size: 14px; }
        .signature-title { font-size: 12px; color: #64748b; }
        .no-print { position: fixed; bottom: 30px; right: 30px; z-index: 50; display: flex; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .controls-panel { background: white; padding: 12px 16px; display: flex; align-items: center; gap: 16px; border-right: 1px solid #e2e8f0; }
        .checkbox-label { display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer; font-family: 'Cairo', sans-serif; font-weight: 600; color: #334155; }
        .checkbox-label input { width: 16px; height: 16px; accent-color: #0f766e; cursor: pointer; }
        .print-btn { background: #0f766e; color: white; border: none; padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: 'Cairo', sans-serif; }
        .print-btn:hover { background: #0d9488; }
        @media print {
          body.printing-prescription > div:not(:last-child), body.printing-prescription header, body.printing-prescription nav, body.printing-prescription aside, body.printing-prescription [data-slot="sidebar"], body.printing-prescription .sidebar, body.printing-prescription .no-print { display: none !important; }
          body.printing-prescription main, body.printing-prescription .main-content, body.printing-prescription [data-slot="content"] { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
          body { padding: 0 !important; margin: 0 !important; background: white !important; }
          .prescription-page { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
          .header, .info-box.right-box, th, .instructions-text, .diagnosis-tag { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="no-print">
        <div className="controls-panel">
          <label className="checkbox-label">
            <input type="checkbox" checked={printCopies.en} onChange={(e) => setPrintCopies({...printCopies, en: e.target.checked})} />
            🇬🇧 English
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={printCopies.ar} onChange={(e) => setPrintCopies({...printCopies, ar: e.target.checked})} />
            🇪🇬 نسخة عربي
          </label>
        </div>
        <button className="print-btn" onClick={() => window.print()}>
          🖨️ Print
        </button>
      </div>

      {/* النسخة الإنجليزي (بتستخدم البيانات الأصلية) */}
      {printCopies.en && <PrescriptionPage prescription={prescription} clinic={clinic} lang="en" translatedData={{ diagnoses: [], items: [] }} />}
      
      {/* النسخة العربية (بتستخدم البيانات المترجمة آلياً) */}
      {printCopies.ar && <PrescriptionPage prescription={prescription} clinic={clinic} lang="ar" translatedData={translatedData} />}
    </>
  )
}

export { PrintPrescriptionView };