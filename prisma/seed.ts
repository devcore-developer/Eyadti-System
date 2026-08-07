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

// ── Helper for Batch Insert ────────────────────────
async function batchInsert<T extends { [key: string]: any }>(model: any, data: T[], batchSize: number = 1000) {
  let inserted = 0
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    const res = await model.createMany({ data: batch, skipDuplicates: true })
    inserted += res.count
    // وقفة بسيطة بين كل Batch عشان Neon ما تقفلش الاتصال
    if (i + batchSize < data.length) {
      await new Promise(r => setTimeout(r, 100)) 
    }
  }
  return inserted
}

async function main() {
  console.log("🌱 Seeding medical dictionary (New Schema)...")

  // ════════════════════════════════════════════════════
  // COMPLAINTS (الأعراض والشكاوى)
  // ════════════════════════════════════════════════════
  console.log("🔍 Reading Disease & Symptoms CSV files...")
  
  const symptomsPath = path.join(__dirname, "data/disease-symptoms.csv")
  const symptomsData = await readCSV<any>(symptomsPath)
  
  const complaintsSet = new Set<string>()
  
  for (const row of symptomsData) {
    for (let i = 1; i <= 17; i++) {
      const symptom = row[`Symptom_${i}`]
      if (symptom && symptom.trim() !== '') {
        const cleanSymptom = symptom.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
        const formattedSymptom = cleanSymptom.charAt(0).toUpperCase() + cleanSymptom.slice(1)
        complaintsSet.add(formattedSymptom)
      }
    }
  }

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
    const result = await prisma.complaint.createMany({ data: finalComplaints, skipDuplicates: true })
    console.log(`✅ Seeded ${result.count} complaints (from CSV + defaults)`)
  }

  // ════════════════════════════════════════════════════
  // DIAGNOSES (ICD-10 & Precautions)
  // ════════════════════════════════════════════════════
  console.log("🔍 Reading ICD-10 CSV files...")

  const icd10Details = await readCSV<any>(path.join(__dirname, "data/icd10-details.csv"))
  const headCodes = await readCSV<any>(path.join(__dirname, "data/head-codes.csv"))

  const allDiagnosesRaw = [
    ...icd10Details.map(row => ({
      name: (row.definition || "").replace(/(\r\n|\n|\r)/gm, " ").trim(),
      icd10Code: (row["sub-code"] || "").trim(),
    })),
    ...headCodes.map(row => ({
      name: (row.name || "").trim(),
      icd10Code: (row.head_code || "").trim(),
    })),
  ]

  const cleanDiagnoses = allDiagnosesRaw.filter(d => d.name && d.name.length > 1)
  const uniqueDiagnosesMap = new Map<string, { name: string; icd10Code: string | null }>()
  for (const d of cleanDiagnoses) {
    const key = d.icd10Code || d.name
    if (!uniqueDiagnosesMap.has(key)) uniqueDiagnosesMap.set(key, d)
  }

  console.log("🔍 Reading Disease Precautions CSV file...")
  const precautionsData = await readCSV<any>(path.join(__dirname, "data/disease-precautions.csv"))
  const extraDiagnoses = precautionsData.map(row => ({ name: (row.Disease || "").trim(), icd10Code: null })).filter(d => d.name.length > 1)

  for (const d of extraDiagnoses) {
    if (!uniqueDiagnosesMap.has(d.name)) uniqueDiagnosesMap.set(d.name, d)
  }

  const finalDiagnoses = Array.from(uniqueDiagnosesMap.values())

  if (finalDiagnoses.length > 0) {
    const result = await prisma.diagnosis.createMany({ data: finalDiagnoses, skipDuplicates: true })
    console.log(`✅ Seeded ${result.count} ICD-10 & Precaution diagnoses`)
  }

  // ════════════════════════════════════════════════════
  // MEDICATIONS (الأدوية)
  // ════════════════════════════════════════════════════
  console.log("🔍 Reading Egyptian Medications CSV file...")
  const medsData = await readCSV<any>(path.join(__dirname, "data/egyptian-medications.csv"))

  const csvMedications = medsData.map(row => ({
    tradeName: (row.Drugname || "").trim(), genericName: null, strength: null, dosageForm: (row.Form || "").trim() || null,
  })).filter(m => m.tradeName.length > 1)

  const defaultMedications = [
    { tradeName: "Panadol", genericName: "Paracetamol", strength: "500mg", dosageForm: "Tablet" },
    { tradeName: "Augmentin", genericName: "Amoxicillin + Clavulanate", strength: "1g/125mg", dosageForm: "Tablet" },
    { tradeName: "Concor", genericName: "Bisoprolol", strength: "5mg", dosageForm: "Tablet" },
    { tradeName: "Glucophage", genericName: "Metformin", strength: "500mg", dosageForm: "Tablet" },
  ]

  const allMedicationsRaw = [...csvMedications, ...defaultMedications]
  const uniqueMedsMap = new Map<string, typeof allMedicationsRaw[0]>()
  for (const m of allMedicationsRaw) {
    const key = `${m.tradeName.toLowerCase()}-${m.strength}`
    if (!uniqueMedsMap.has(key)) uniqueMedsMap.set(key, m)
  }

  const finalMedications = Array.from(uniqueMedsMap.values())

  if (finalMedications.length > 0) {
    console.log(`⏳ Inserting ${finalMedications.length} medications in batches...`)
    const count = await batchInsert(prisma.medication, finalMedications, 2000)
    console.log(`✅ Seeded ${count} Egyptian market medications`)
  }

  // ════════════════════════════════════════════════════
  // ALLERGIES DICTIONARY
  // ════════════════════════════════════════════════════
  console.log("🔍 Seeding Allergies Dictionary...")

  const allergiesData = [
    { name: "Penicillin", category: "Drug" }, { name: "Amoxicillin", category: "Drug" },
    { name: "Ampicillin", category: "Drug" }, { name: "Amoxicillin-Clavulanate", category: "Drug" },
    { name: "Cephalexin", category: "Drug" }, { name: "Ceftriaxone", category: "Drug" },
    { name: "Ibuprofen", category: "Drug" }, { name: "Aspirin", category: "Drug" },
    { name: "Sulfonamides", category: "Drug" }, { name: "Insulin Glargine", category: "Drug" },
    { name: "Latex", category: "Environmental" }, { name: "Rubber", category: "Environmental" },
    { name: "Dust Mites", category: "Environmental" }, { name: "Cat Dander", category: "Environmental" },
    { name: "Peanut", category: "Food" }, { name: "Shellfish", category: "Food" },
    { name: "Milk", category: "Food" }, { name: "Egg", category: "Food" },
    { name: "Gluten", category: "Food" }, { name: "Soy", category: "Food" },
  ]

  if (allergiesData.length > 0) {
    const result = await prisma.allergyDict.createMany({ data: allergiesData, skipDuplicates: true })
    console.log(`✅ Seeded ${result.count} allergies into dictionary`)
  }

  // ════════════════════════════════════════════════════
  // SURGICAL PROCEDURES DICTIONARY
  // ════════════════════════════════════════════════════
  console.log("🔍 Reading Surgical Procedures Dictionary CSV file...")
  const surgeriesPath = path.join(__dirname, "data/surgical_procedures.csv")
  const finalSurgeries = []

  if (fs.existsSync(surgeriesPath)) {
    const fileContent = fs.readFileSync(surgeriesPath, 'utf-8').replace(/^\uFEFF/, '')
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '')
    
    if (lines.length > 1) {
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',')
        const name = (parts[1] || "").trim().replace(/^"|"$/g, '')
        const specialty = (parts[2] || "").trim().replace(/^"|"$/g, '')
        if (name.length > 1) {
          finalSurgeries.push({ name, specialty: specialty || null })
        }
      }
    }
  }

  if (finalSurgeries.length > 0) {
    const result = await prisma.surgeryDict.createMany({ data: finalSurgeries, skipDuplicates: true })
    console.log(`✅ Seeded ${result.count} surgical procedures into dictionary`)
  } else {
    console.log("⚠️ No surgical procedures found to seed.")
  }

  // ════════════════════════════════════════════════════
  // TREATMENT TEMPLATES
  // ════════════════════════════════════════════════════
  const templates = [
    { title: "Acute Gastritis", content: "Losec 20mg once daily before breakfast", specialty: "Gastroenterology" },
    { title: "Hypertension Initial", content: "Norvasc 5mg once daily", specialty: "Cardiology" },
    { title: "Uncomplicated URI", content: "Panadol 500mg every 6 hours PRN", specialty: "General" },
  ]

  for (const t of templates) {
    const existing = await prisma.treatmentTemplate.findFirst({ where: { title: t.title } })
    if (!existing) await prisma.treatmentTemplate.create({ data: t })
  }
  console.log(`✅ Seeded ${templates.length} treatment templates`)

  // ════════════════════════════════════════════════════
  // PAST MEDICAL HISTORY DICTIONARY
  // ════════════════════════════════════════════════════
  console.log("🔍 Building Past Medical History Dictionary...")

  const pmhSet = new Set<string>()

  finalDiagnoses.forEach(d => pmhSet.add(d.name))
  finalMedications.forEach(m => pmhSet.add(m.tradeName))
  finalComplaints.forEach(c => pmhSet.add(c.name))

  const diseaseSymptomsData = await readCSV<any>(path.join(__dirname, "data/disease-symptoms.csv"))
  
  diseaseSymptomsData.forEach(row => {
    const diseaseName = (row.Disease || row.Name || row.name || "").toString().trim()
    if (diseaseName.length > 1) {
      const cleanName = diseaseName.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
      pmhSet.add(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
    }
  })

  // ← التعديل السحري: تحويل المصفوفات لـ Sets لتسريع البحث من 4 مليار عملية لـ 70 ألف عملية فقط!
  const medNamesSet = new Set(finalMedications.map(m => m.tradeName.toLowerCase()))
  const complaintNamesSet = new Set(finalComplaints.map(c => c.name))

  const finalPmh = Array.from(pmhSet).map(name => {
    let category = "Disease"
    if (medNamesSet.has(name.toLowerCase())) {
      category = "Medication"
    } else if (complaintNamesSet.has(name)) {
      category = "Symptom"
    }
    return { name, category }
  })

  if (finalPmh.length > 0) {
    console.log(`⏳ Inserting ${finalPmh.length} PMH items in batches to avoid Neon timeout...`)
    const count = await batchInsert(prisma.medicalHistoryDict, finalPmh, 1000) // Batch 1000
    console.log(`✅ Seeded ${count} Past Medical History items into dictionary`)
  }

  // ════════════════════════════════════════════════════
  // SaaS PLANS SEEDING
  // ════════════════════════════════════════════════════
  console.log("🌱 Seeding SaaS plans...")

  const plansData = [
    {
      name: "Standard",
      slug: "standard",
      description: "For small clinics and solo doctors",
      monthlyPrice: 600,
      yearlyPrice: 6000,
      maxDoctors: 2,
      maxUsers: 2,
      maxPatients: 500,
      maxBranches: 1,
      maxMonthlyVisits: 200,
      onlineBookingEnabled: true,
      analyticsEnabled: false,
      whatsappEnabled: false,
      auditLogsEnabled: false,
      galleryEnabled: false,
      advancedInvoicesEnabled: false,
      doctorSchedulesEnabled: true,
      doctorAttendanceEnabled: false,
      queueManagementEnabled: false,
      waitingRoomDisplayEnabled: false,
      active: true,
    },
    {
      name: "Professional",
      slug: "professional",
      description: "For growing clinics and medical centers",
      monthlyPrice: 1000,
      yearlyPrice: 10000,
      maxDoctors: 15,
      maxUsers: 15,
      maxPatients: -1,
      maxBranches: 5,
      maxMonthlyVisits: -1,
      onlineBookingEnabled: true,
      analyticsEnabled: true,
      whatsappEnabled: true,
      auditLogsEnabled: true,
      galleryEnabled: true,
      advancedInvoicesEnabled: true,
      doctorSchedulesEnabled: true,
      doctorAttendanceEnabled: true,
      queueManagementEnabled: true,
      waitingRoomDisplayEnabled: true,
      active: true,
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      description: "For large clinics, hospitals, and organizations",
      monthlyPrice: 2000,
      yearlyPrice: 20000,
      maxDoctors: -1,
      maxUsers: -1,
      maxPatients: -1,
      maxBranches: -1,
      maxMonthlyVisits: -1,
      onlineBookingEnabled: true,
      analyticsEnabled: true,
      whatsappEnabled: true,
      auditLogsEnabled: true,
      galleryEnabled: true,
      advancedInvoicesEnabled: true,
      doctorSchedulesEnabled: true,
      doctorAttendanceEnabled: true,
      queueManagementEnabled: true,
      waitingRoomDisplayEnabled: true,
      active: true,
    },
  ]

  for (const plan of plansData) {
    const existing = await prisma.plan.findUnique({
      where: { slug: plan.slug },
    })

    if (existing) {
      await prisma.plan.update({
        where: { slug: plan.slug },
        data: plan,
      })
      console.log(`  ✅ Updated plan: ${plan.name}`)
    } else {
      await prisma.plan.create({ data: plan })
      console.log(`  ✅ Created plan: ${plan.name}`)
    }
  }

  // Deactivate old plans if no active subscriptions
  const oldSlugs = ["starter", "pro", "default-plan"]
  for (const slug of oldSlugs) {
    const old = await prisma.plan.findUnique({ where: { slug } })
    if (old) {
      const activeCount = await prisma.subscription.count({
        where: { planId: old.id, status: { in: ["TRIAL", "ACTIVE"] } },
      })
      if (activeCount === 0) {
        await prisma.plan.update({
          where: { slug },
          data: { active: false },
        })
        console.log(`  ⚠️ Deactivated old plan: ${slug}`)
      } else {
        console.log(`  ⚠️ Old plan "${slug}" has ${activeCount} active subs - kept active`)
      }
    }
  }

  console.log("🎉 Seeding complete!")
}

// أضف هذه الدالة في prisma/seed.ts واستدعها في main()

async function seedPlans() {
  console.log("🌱 Seeding SaaS plans...")

  const { PLANS_CONFIG } = await import("@/lib/constants/features")

  const plans = [
    PLANS_CONFIG.STANDARD,
    PLANS_CONFIG.PROFESSIONAL,
    PLANS_CONFIG.ENTERPRISE,
  ]

  for (const plan of plans) {
    const existing = await prisma.plan.findUnique({
      where: { slug: plan.slug },
    })

    if (existing) {
      // Update existing plan with correct values (migration)
      await prisma.plan.update({
        where: { slug: plan.slug },
        data: {
          name: plan.name,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
          maxDoctors: plan.maxDoctors,
          maxUsers: plan.maxUsers,
          maxPatients: plan.maxPatients,
          maxBranches: plan.maxBranches,
          maxMonthlyVisits: plan.maxMonthlyVisits,
          onlineBookingEnabled: plan.onlineBookingEnabled,
          analyticsEnabled: plan.analyticsEnabled,
          whatsappEnabled: plan.whatsappEnabled,
          auditLogsEnabled: plan.auditLogsEnabled,
          galleryEnabled: plan.galleryEnabled,
          advancedInvoicesEnabled: plan.advancedInvoicesEnabled,
          doctorSchedulesEnabled: plan.doctorSchedulesEnabled,
          doctorAttendanceEnabled: plan.doctorAttendanceEnabled,
          queueManagementEnabled: plan.queueManagementEnabled,
          waitingRoomDisplayEnabled: plan.waitingRoomDisplayEnabled,
          active: true,
        },
      })
      console.log(`  ✅ Updated plan: ${plan.name}`)
    } else {
      await prisma.plan.create({
        data: {
          ...plan,
          active: true,
        },
      })
      console.log(`  ✅ Created plan: ${plan.name}`)
    }
  }

  // Deactivate old plans (starter, pro) if they exist
  const oldSlugs = ["starter", "pro", "default-plan"]
  for (const slug of oldSlugs) {
    const old = await prisma.plan.findUnique({ where: { slug } })
    if (old) {
      // Check if any active subscriptions use this plan
      const activeCount = await prisma.subscription.count({
        where: { planId: old.id, status: { in: ["TRIAL", "ACTIVE"] } },
      })

      if (activeCount === 0) {
        await prisma.plan.update({
          where: { slug },
          data: { active: false },
        })
        console.log(`  ⚠️ Deactivated old plan: ${slug}`)
      } else {
        console.log(`  ⚠️ Old plan "${slug}" has ${activeCount} active subscriptions - keeping active for now`)
      }
    }
  }

  console.log("✅ Plans seeding complete!")
}

// في دالة main()، أضف قبل seed النهائي:
// await seedPlans()

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })