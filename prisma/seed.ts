import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import fs from "fs"
import path from "path"
import csv from "csv-parser"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ── Helper Function to Read CSV ────────────────────────
function readCSV<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${filePath}`)
      resolve([])
      return
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data as T))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error))
  })
}

async function main() {
  console.log("🌱 Seeding medical dictionary (New Schema)...")

  // ════════════════════════════════════════════════════
  // COMPLAINTS (الأعراض والشكاوى من ملفات CSV + الافتراضية)
  // ════════════════════════════════════════════════════
  console.log("🔍 Reading Disease & Symptoms CSV files...")
  
  const symptomsPath = path.join(__dirname, "data/disease-symptoms.csv")
  const symptomsData = await readCSV<any>(symptomsPath)
  
  const complaintsSet = new Set<string>()
  
  // استخراج الأعراض من ملف DiseaseAndSymptoms.csv
  for (const row of symptomsData) {
    for (let i = 1; i <= 17; i++) {
      const symptom = row[`Symptom_${i}`]
      if (symptom && symptom.trim() !== '') {
        // تنظيف النص: إزالة الـ Underscores وتصحيح المسافات وتكبير أول حرف
        const cleanSymptom = symptom.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
        const formattedSymptom = cleanSymptom.charAt(0).toUpperCase() + cleanSymptom.slice(1)
        complaintsSet.add(formattedSymptom)
      }
    }
  }

  // إضافة الشكاوى الافتراضية اللي كانت عندنا عشان مختشيش
  const defaultComplaints = [
    "Headache", "Fever", "Chest Pain", "Abdominal Pain", "Cough",
    "Shortness of Breath", "Dizziness", "Nausea", "Vomiting", "Diarrhea",
    "Constipation", "Fatigue", "Back Pain", "Sore Throat", "Joint Pain",
    "Skin Rash", "Blurred Vision", "Palpitation", "Heartburn", "Loss of Appetite",
    "Weight Loss", "Weight Gain", "Insomnia", "Anxiety", "Ear Pain",
    "Nasal Congestion", "Runny Nose", "Itching", "Burning Urination", "Frequent Urination",
    "Swelling of Legs", "Numbness", "Tingling", "Muscle Weakness", "Toothache",
    "Bleeding Gums", "Hair Loss", "Acne", "Wheezing", "Knee Pain",
    "Neck Pain", "Shoulder Pain", "Eye Redness", "Dry Eyes", "Tinnitus",
    "Hearing Loss", "Chest Tightness", "Leg Pain", "Snoring", "Excessive Sweating"
  ]
  
  defaultComplaints.forEach(c => complaintsSet.add(c))

  const finalComplaints = Array.from(complaintsSet).map(name => ({ name }))

  if (finalComplaints.length > 0) {
    const result = await prisma.complaint.createMany({
      data: finalComplaints,
      skipDuplicates: true, // يتجاهل الأعراض المتكررة
    })
    console.log(`✅ Seeded ${result.count} complaints (from CSV + defaults)`)
  } else {
    console.log("⚠️ No complaints found to seed.")
  }

  // ════════════════════════════════════════════════════
  // DIAGNOSES (ICD-10 Version 2019 - From CSV Files)
  // ════════════════════════════════════════════════════
  console.log("🔍 Reading ICD-10 CSV files...")

  const icd10DetailsPath = path.join(__dirname, "data/icd10-details.csv")
  const headCodesPath = path.join(__dirname, "data/head-codes.csv")

  const icd10Details = await readCSV<any>(icd10DetailsPath)
  const headCodes = await readCSV<any>(headCodesPath)

  // دمج الملفين في مصفوفة واحدة بناءً على أسماء الأعمدة اللي في الـ CSV
  const allDiagnosesRaw = [
    ...icd10Details.map(row => {
      // تنظيف الاسم من أي سطور جديدة (Line breaks) عشان يظهر بشكل سليم في الـ UI
      const cleanName = (row.definition || "").replace(/(\r\n|\n|\r)/gm, " ").trim()
      return {
        name: cleanName,
        icd10Code: (row["sub-code"] || "").trim(),
      }
    }),
    ...headCodes.map(row => ({
      name: (row.name || "").trim(),
      icd10Code: (row.head_code || "").trim(),
    })),
  ]

  // تنظيف البيانات: إزالة أي صفوف فارغة أو بدون اسم تشخيص
  const cleanDiagnoses = allDiagnosesRaw.filter(d => d.name && d.name.length > 1)

  // إزالة التكرار (لو في كود متكرر في الملفين)
  const uniqueDiagnosesMap = new Map<string, { name: string; icd10Code: string | null }>()
  for (const d of cleanDiagnoses) {
    const key = d.icd10Code || d.name // استخدام الكود كمفتاح فريد، أو الاسم لو مفيش كود
    if (!uniqueDiagnosesMap.has(key)) {
      uniqueDiagnosesMap.set(key, d)
    }
  }

  // ────────────────────────────────────────────────────
  // إضافة أمراض ملف Precautions كـ Diagnoses إضافية
  // ────────────────────────────────────────────────────
  console.log("🔍 Reading Disease Precautions CSV file...")
  const precautionsPath = path.join(__dirname, "data/disease-precautions.csv")
  const precautionsData = await readCSV<any>(precautionsPath)
  
  const extraDiagnoses = precautionsData
    .map(row => ({
      name: (row.Disease || "").trim(),
      icd10Code: null
    }))
    .filter(d => d.name.length > 1)

  // دمج أمراض الـ Precautions مع أمراض الـ ICD-10
  for (const d of extraDiagnoses) {
    const key = d.name // الاسم هو المفتاح هنا لأن مفيش كود
    if (!uniqueDiagnosesMap.has(key)) {
      uniqueDiagnosesMap.set(key, d)
    }
  }

  const finalDiagnoses = Array.from(uniqueDiagnosesMap.values())

  if (finalDiagnoses.length > 0) {
    const result = await prisma.diagnosis.createMany({
      data: finalDiagnoses,
      skipDuplicates: true, // يتجاهل لو في كود متكرر بالفعل في الداتابيز
    })
    console.log(`✅ Seeded ${result.count} ICD-10 & Precaution diagnoses (out of ${finalDiagnoses.length} processed)`)
  } else {
    console.log("⚠️ No valid diagnoses found in CSV files.")
  }

  // ════════════════════════════════════════════════════
  // MEDICATIONS (الأدوية من ملف CSV + الافتراضية)
  // ════════════════════════════════════════════════════
  console.log("🔍 Reading Egyptian Medications CSV file...")

  const medsPath = path.join(__dirname, "data/egyptian-medications.csv")
  const medsData = await readCSV<any>(medsPath)

  // 1. قراءة الأدوية من الـ CSV وتعيين الأعمدة الصحيحة
  const csvMedications = medsData.map(row => ({
    tradeName: (row.Drugname || "").trim(),
    genericName: null, // مش موجود كعمود منفصل في الملف
    strength: null,    // مش موجود كعمود منفصل في الملف
    dosageForm: (row.Form || "").trim() || null,
  })).filter(m => m.tradeName.length > 1) // استبعاد أي صف فاضي

  // 2. الأدوية الافتراضية (لأنها فيها الاسم العلمي والتركيز مفصلة)
  const defaultMedications = [
    { tradeName: "Panadol", genericName: "Paracetamol", strength: "500mg", dosageForm: "Tablet" },
    { tradeName: "Panadol Extra", genericName: "Paracetamol + Caffeine", strength: "500mg/65mg", dosageForm: "Tablet" },
    { tradeName: "Augmentin", genericName: "Amoxicillin + Clavulanate", strength: "1g/125mg", dosageForm: "Tablet" },
    { tradeName: "Losec", genericName: "Omeprazole", strength: "20mg", dosageForm: "Capsule" },
    { tradeName: "Concor", genericName: "Bisoprolol", strength: "5mg", dosageForm: "Tablet" },
    { tradeName: "Glucophage", genericName: "Metformin", strength: "500mg", dosageForm: "Tablet" },
    { tradeName: "Ventolin", genericName: "Salbutamol", strength: "100mcg/puff", dosageForm: "Inhaler" },
    { tradeName: "Brufen", genericName: "Ibuprofen", strength: "400mg", dosageForm: "Tablet" },
    { tradeName: "Zyrtec", genericName: "Cetirizine", strength: "10mg", dosageForm: "Tablet" },
    { tradeName: "Flagyl", genericName: "Metronidazole", strength: "500mg", dosageForm: "Tablet" },
    // ... (لو حابب تسيب باقي الأدوية اليدوية امسح الكومنت وحطها، أو لو واثق في الـ CSV سيب دول بس)
  ]

  // دمج الاتنين
  const allMedicationsRaw = [...csvMedications, ...defaultMedications]

  // إزالة التكرار (عشان Panadol متتكررش لو موجود في الـ CSV والـ Default)
  const uniqueMedsMap = new Map<string, typeof allMedicationsRaw[0]>()
  for (const m of allMedicationsRaw) {
    const key = `${m.tradeName.toLowerCase()}-${m.strength}` // التكرار مبني على الاسم والتركيز
    if (!uniqueMedsMap.has(key)) {
      uniqueMedsMap.set(key, m)
    }
  }

  const finalMedications = Array.from(uniqueMedsMap.values())

  if (finalMedications.length > 0) {
    const result = await prisma.medication.createMany({
      data: finalMedications,
      skipDuplicates: true, // أمان إضافي من Prisma لو في أسماء متطابقة 100%
    })
    console.log(`✅ Seeded ${result.count} Egyptian market medications (from CSV + defaults)`)
  } else {
    console.log("⚠️ No medications found to seed.")
  }

  
  // ════════════════════════════════════════════════════
  // TREATMENT TEMPLATES
  // ════════════════════════════════════════════════════
  const templates = [
    {
      title: "Acute Gastritis",
      content: "Losec 20mg once daily before breakfast\nAntacid syrup 15ml after meals\nAvoid spicy food and NSAIDs\nFollow-up after 2 weeks",
      specialty: "Gastroenterology",
    },
    {
      title: "Hypertension Initial",
      content: "Norvasc 5mg once daily\nLow sodium diet\nRegular exercise 30min/day\nBP check in 2 weeks",
      specialty: "Cardiology",
    },
    {
      title: "Uncomplicated URI",
      content: "Panadol 500mg every 6 hours PRN for fever\nMucosolvan syrup 10ml 3 times daily\nSaltwater gargle\nRest and hydration\nReturn if fever >3 days",
      specialty: "General",
    },
    {
      title: "Migraine Attack",
      content: "Imigran 50mg at onset\nPanadol Extra as needed\nRest in dark quiet room\nIf recurrent: Topamax 25mg for prevention",
      specialty: "Neurology",
    },
    {
      title: "Allergic Rhinitis",
      content: "Zyrtec 10mg once daily\nNasonex nasal spray 2 puffs each nostril daily\nAvoid allergens\nFollow-up in 1 month",
      specialty: "ENT",
    },
    {
      title: "UTI Female",
      content: "Ciprobay 500mg twice daily for 3 days\nPlenty of water\nFlagyl 500mg 3 times daily if needed\nUrine culture after treatment",
      specialty: "Urology",
    },
    {
      title: "Acute Tonsillitis",
      content: "Augmentin 1g twice daily for 7 days\nPanadol 500mg every 6 hours PRN\nWarm saltwater gargle\nReturn if no improvement in 48 hours",
      specialty: "ENT",
    },
    {
      title: "Type 2 Diabetes Initial",
      content: "Glucophage 500mg twice daily with meals\nLow carb diet\nRegular exercise 30min/day\nFBS and HbA1c in 3 months",
      specialty: "Endocrinology",
    },
    {
      title: "Acute Bronchitis",
      content: "Panadol 500mg every 6 hours PRN\nMucosolvan syrup 10ml 3 times daily\nPlenty of fluids\nVentolin inhaler 2 puffs PRN if wheezing\nReturn if fever persists >5 days",
      specialty: "Pulmonology",
    },
    {
      title: "GERD",
      content: "Nexium 40mg once daily before breakfast\nAntacid syrup 15ml after meals\nAvoid caffeine, smoking, spicy food\nDon't lie down 3 hours after eating\nFollow-up in 4 weeks",
      specialty: "Gastroenterology",
    },
  ]

  for (const t of templates) {
    const existing = await prisma.treatmentTemplate.findFirst({
      where: { title: t.title },
    })
    if (!existing) {
      await prisma.treatmentTemplate.create({ data: t })
    }
  }
  console.log(`✅ Seeded ${templates.length} treatment templates`)

  console.log("🎉 Seeding complete!")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })