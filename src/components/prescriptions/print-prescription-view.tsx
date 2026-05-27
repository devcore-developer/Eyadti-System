// src/components/prescriptions/print-prescription-view.tsx

"use client"

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
}

type ClinicData = {
  name: string
  phone: string | null
  address: string | null
}

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

export function PrintPrescriptionView({ prescription, clinic }: PrintPrescriptionViewProps) {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8fafc;
          color: #1e293b;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .prescription-page {
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }

        /* Premium Header */
        .header {
          background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
          color: white;
          padding: 32px 40px;
          position: relative;
        }

        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .header p {
          margin: 4px 0 0;
          opacity: 0.9;
          font-size: 14px;
        }

        /* The Rx Symbol */
        .rx-badge {
          position: absolute;
          right: 40px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 72px;
          font-weight: 800;
          font-family: serif;
          opacity: 0.2;
          line-height: 1;
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background-color: #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }

        .info-box {
          background: #ffffff;
          padding: 24px 40px;
        }

        .info-box.right-box {
          background: #f8fafc;
        }

        .info-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }

        .info-sub {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }

        /* Medication Table */
        .medications {
          padding: 32px 40px;
        }

        .medications h2 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #0f766e;
          margin: 0 0 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .medications h2::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 12px 16px;
          background: #f1f5f9;
          color: #475569;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
        }

        td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #334155;
          vertical-align: top;
        }

        tr:last-child td {
          border-bottom: none;
        }

        .med-name {
          font-weight: 600;
          color: #0f172a;
        }

        .instructions-text {
          color: #b45309;
          font-weight: 500;
          font-size: 13px;
          background: #fffbeb;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        /* Watermark */
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 300px;
          font-family: serif;
          font-weight: bold;
          color: rgba(15, 118, 110, 0.03);
          pointer-events: none;
          z-index: 0;
        }

        /* Signature & Footer */
        .footer-section {
          padding: 40px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          position: relative;
          z-index: 1;
        }

        .system-note {
          font-size: 11px;
          color: #94a3b8;
        }

        .signature-block {
          text-align: center;
        }

        .signature-line {
          width: 200px;
          border-top: 1px dashed #cbd5e1;
          margin-bottom: 8px;
          padding-top: 40px;
        }

        .signature-name {
          font-weight: 600;
          color: #0f172a;
          font-size: 14px;
        }

        .signature-title {
          font-size: 12px;
          color: #64748b;
        }

        /* Print Button - Hidden on print */
        .no-print {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 50;
        }

        .print-btn {
          background: #0f766e;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }

        .print-btn:hover {
          background: #0d9488;
        }

        @media print {
          body {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .prescription-page {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
          /* إجبار المتصفح يطبع الألوان (الهيدر الأخضر والخلفيات) */
          .header, .info-box.right-box, th, .instructions-text {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Print Button */}
      <div className="no-print">
        <button className="print-btn" onClick={() => window.print()}>
          🖨️ Print Prescription
        </button>
      </div>

      {/* Prescription Layout */}
      <div className="prescription-page">
        {/* Watermark */}
        <div className="watermark">℞</div>

        {/* Header */}
        <div className="header">
          <h1>{clinic?.name || "Eyadti Clinic"}</h1>
          <p>{[clinic?.phone, clinic?.address].filter(Boolean).join(" • ")}</p>
          <div className="rx-badge">℞</div>
        </div>

        {/* Patient & Doctor Info */}
        <div className="info-grid">
          <div className="info-box">
            <div className="info-label">Patient Information</div>
            <div className="info-value">{prescription.patient.fullName}</div>
            <div className="info-sub">Phone: {prescription.patient.phone || "—"}</div>
          </div>
          <div className="info-box right-box">
            <div className="info-label">Prescription Details</div>
            <div className="info-value">Dr. {prescription.doctor.name}</div>
            <div className="info-sub">{formatDate(prescription.createdAt)}</div>
          </div>
        </div>

        {/* Medications Table */}
        <div className="medications">
          <h2>Prescribed Medications</h2>
          <table>
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "30%" }}>Medication</th>
                <th style={{ width: "15%" }}>Dosage</th>
                <th style={{ width: "20%" }}>Frequency</th>
                <th style={{ width: "15%" }}>Duration</th>
                <th style={{ width: "15%" }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {prescription.items.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ color: "#94a3b8" }}>{index + 1}</td>
                  <td className="med-name">{item.medicationName}</td>
                  <td>{item.dosage}</td>
                  <td>{item.frequency}</td>
                  <td>{item.duration}</td>
                  <td>
                    {item.instructions ? (
                      <span className="instructions-text">{item.instructions}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature & Footer */}
        <div className="footer-section">
          <div className="system-note">
            Generated by Eyadti System • {formatDate(new Date())}
          </div>
          <div className="signature-block">
            <div className="signature-line"></div>
            <div className="signature-name">Dr. {prescription.doctor.name}</div>
            <div className="signature-title">Signature</div>
          </div>
        </div>
      </div>
    </>
  )
}