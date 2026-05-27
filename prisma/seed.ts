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
  // COMPLAINTS (الشكاوى)
  // ════════════════════════════════════════════════════
  const complaints = [
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

  let complaintCount = 0
  for (const name of complaints) {
    const existing = await prisma.complaint.findFirst({ where: { name } })
    if (!existing) {
      await prisma.complaint.create({ data: { name } })
      complaintCount++
    }
  }
  console.log(`✅ Seeded ${complaintCount} complaints`)

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
      let cleanName = (row.definition || "").replace(/(\r\n|\n|\r)/gm, " ").trim()
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
  const uniqueDiagnosesMap = new Map<string, { name: string; icd10Code: string }>()
  for (const d of cleanDiagnoses) {
    const key = d.icd10Code || d.name // استخدام الكود كمفتاح فريد، أو الاسم لو مفيش كود
    if (!uniqueDiagnosesMap.has(key)) {
      uniqueDiagnosesMap.set(key, d)
    }
  }

  const finalDiagnoses = Array.from(uniqueDiagnosesMap.values())

  if (finalDiagnoses.length > 0) {
    // استخدام createMany لأنها أسرع بكتر من upsert في ملفات الـ ICD الكبيرة
    const result = await prisma.diagnosis.createMany({
      data: finalDiagnoses,
      skipDuplicates: true, // يتجاهل لو في كود متكرر بالفعل في الداتابيز
    })
    console.log(`✅ Seeded ${result.count} ICD-10 diagnoses (out of ${finalDiagnoses.length} processed)`)
  } else {
    console.log("⚠️ No valid ICD-10 diagnoses found in CSV files.")
  }

  // ════════════════════════════════════════════════════
  // MEDICATIONS (الأدوية المصرية)
  // ════════════════════════════════════════════════════
  const medications = [
    // ── Analgesics & Antipyretics ────────────────────
    { tradeName: "Panadol", genericName: "Paracetamol", strength: "500mg", dosageForm: "Tablet" },
    { tradeName: "Panadol Extra", genericName: "Paracetamol + Caffeine", strength: "500mg/65mg", dosageForm: "Tablet" },
    { tradeName: "Panadol Cold & Flu", genericName: "Paracetamol + Pseudoephedrine + Chlorpheniramine", strength: "500mg/30mg/2mg", dosageForm: "Tablet" },
    { tradeName: "Brufen", genericName: "Ibuprofen", strength: "400mg", dosageForm: "Tablet" },
    { tradeName: "Cataflam", genericName: "Diclofenac Potassium", strength: "50mg", dosageForm: "Tablet" },
    { tradeName: "Voltaren", genericName: "Diclofenac Sodium", strength: "50mg", dosageForm: "Tablet" },
    { tradeName: "Mobic", genericName: "Meloxicam", strength: "15mg", dosageForm: "Tablet" },
    { tradeName: "Celebrex", genericName: "Celecoxib", strength: "200mg", dosageForm: "Capsule" },
    { tradeName: "Solpadeine", genericName: "Paracetamol + Codeine + Caffeine", strength: "500mg/8mg/30mg", dosageForm: "Tablet" },
    { tradeName: "Tramal", genericName: "Tramadol", strength: "50mg", dosageForm: "Capsule" },

    // ── Antibiotics ──────────────────────────────────
    { tradeName: "Augmentin", genericName: "Amoxicillin + Clavulanate", strength: "1g/125mg", dosageForm: "Tablet" },
    { tradeName: "Amoxil", genericName: "Amoxicillin", strength: "500mg", dosageForm: "Capsule" },
    { tradeName: "Zithromax", genericName: "Azithromycin", strength: "500mg", dosageForm: "Tablet" },
    { tradeName: "Ciprobay", genericName: "Ciprofloxacin", strength: "500mg", dosageForm: "Tablet" },
    { tradeName: "Keflex", genericName: "Cephalexin", strength: "500mg", dosageForm: "Capsule" },
    { tradeName: "Flagyl", genericName: "Metronidazole", strength: "500mg", dosageForm: "Tablet" },
    { tradeName: "Erythrocin", genericName: "Erythromycin", strength: "500mg", dosageForm: "Tablet" },
    { tradeName: "Doxymycin", genericName: "Doxycycline", strength: "100mg", dosageForm: "Capsule" },
    { tradeName: "Bactrim", genericName: "Trimethoprim + Sulfamethoxazole", strength: "160mg/800mg", dosageForm: "Tablet" },
    { tradeName: "Rocephin", genericName: "Ceftriaxone", strength: "1g", dosageForm: "Injection" },
    { tradeName: "Unasyn", genericName: "Ampicillin + Sulbactam", strength: "1.5g", dosageForm: "Injection" },
    { tradeName: "Tavanic", genericName: "Levofloxacin", strength: "500mg", dosageForm: "Tablet" },

    // ── Gastrointestinal ─────────────────────────────
    { tradeName: "Losec", genericName: "Omeprazole", strength: "20mg", dosageForm: "Capsule" },
    { tradeName: "Nexium", genericName: "Esomeprazole", strength: "40mg", dosageForm: "Tablet" },
    { tradeName: "Controloc", genericName: "Pantoprazole", strength: "40mg", dosageForm: "Tablet" },
    { tradeName: "Motilium", genericName: "Domperidone", strength: "10mg", dosageForm: "Tablet" },
    { tradeName: "Maxolon", genericName: "Metoclopramide", strength: "10mg", dosageForm: "Tablet" },
    { tradeName: "Antacid", genericName: "Aluminium Hydroxide + Magnesium Hydroxide", strength: "15ml", dosageForm: "Syrup" },
    { tradeName: "Maalox", genericName: "Aluminium Hydroxide + Magnesium Hydroxide", strength: "15ml", dosageForm: "Syrup" },
    { tradeName: "Loperamide", genericName: "Loperamide HCl", strength: "2mg", dosageForm: "Capsule" },
    { tradeName: "Imodium", genericName: "Loperamide HCl", strength: "2mg", dosageForm: "Capsule" },
    { tradeName: "Duspatalin", genericName: "Mebeverine", strength: "135mg", dosageForm: "Tablet" },
    { tradeName: "Buscopan", genericName: "Hyoscine Butylbromide", strength: "10mg", dosageForm: "Tablet" },
    { tradeName: "Lactulose", genericName: "Lactulose", strength: "15ml", dosageForm: "Syrup" },
    { tradeName: "Duphalac", genericName: "Lactulose", strength: "15ml", dosageForm: "Syrup" },
    { tradeName: "Creon", genericName: "Pancreatin", strength: "10000IU", dosageForm: "Capsule" },

    // ── Cardiovascular ───────────────────────────────
    { tradeName: "Concor", genericName: "Bisoprolol", strength: "5mg", dosageForm: "Tablet" },
    { tradeName: "Betaloc", genericName: "Metoprolol", strength: "50mg", dosageForm: "Tablet" },
    { tradeName: "Norvasc", genericName: "Amlodipine", strength: "5mg", dosageForm: "Tablet" },
    { tradeName: "Amlor", genericName: "Amlodipine", strength: "10mg", dosageForm: "Tablet" },
    { tradeName: "Zestril", genericName: "Lisinopril", strength: "10mg", dosageForm: "Tablet" },
    { tradeName: "Capoten", genericName: "Captopril", strength: "25mg", dosageForm: "Tablet" },
    { tradeName: "Cozaar", genericName: "Losartan", strength: "50mg", dosageForm: "Tablet" },
    { tradeName: "Diovan", genericName: "Valsartan", strength: "160mg", dosageForm: "Tablet" },
    { tradeName: "Aspirin Protect", genericName: "Aspirin", strength: "100mg", dosageForm: "Tablet" },
    { tradeName: "Plavix", genericName: "Clopidogrel", strength: "75mg", dosageForm: "Tablet" },
    { tradeName: "Corvedilol", genericName: "Carvedilol", strength: "12.5mg", dosageForm: "Tablet" },
    { tradeName: "Aldactone", genericName: "Spironolactone", strength: "25mg", dosageForm: "Tablet" },
    { tradeName: "Lasix", genericName: "Furosemide", strength: "40mg", dosageForm: "Tablet" },
    { tradeName: "Isordil", genericName: "Isosorbide Dinitrate", strength: "5mg", dosageForm: "Tablet" },
    { tradeName: "Nitroglycerin", genericName: "Nitroglycerin", strength: "0.4mg/spray", dosageForm: "Spray" },

    // ── Diabetes ─────────────────────────────────────
    { tradeName: "Glucophage", genericName: "Metformin", strength: "500mg", dosageForm: "Tablet" },
    { tradeName: "Glucophage XR", genericName: "Metformin", strength: "850mg", dosageForm: "Tablet" },
    { tradeName: "Amaryl", genericName: "Glimepiride", strength: "2mg", dosageForm: "Tablet" },
    { tradeName: "Daonil", genericName: "Glibenclamide", strength: "5mg", dosageForm: "Tablet" },
    { tradeName: "Januvia", genericName: "Sitagliptin", strength: "100mg", dosageForm: "Tablet" },
    { tradeName: "Galvus", genericName: "Vildagliptin", strength: "50mg", dosageForm: "Tablet" },
    { tradeName: "Novomix 30", genericName: "Insulin Aspart", strength: "100IU/ml", dosageForm: "Injection Pen" },
    { tradeName: "Lantus", genericName: "Insulin Glargine", strength: "100IU/ml", dosageForm: "Injection Pen" },

    // ── Respiratory / Asthma & Allergy ───────────────
    { tradeName: "Ventolin", genericName: "Salbutamol", strength: "100mcg/puff", dosageForm: "Inhaler" },
    { tradeName: "Symbicort", genericName: "Budesonide + Formoterol", strength: "160/4.5mcg", dosageForm: "Inhaler" },
    { tradeName: "Seretide", genericName: "Fluticasone + Salmeterol", strength: "125/25mcg", dosageForm: "Inhaler" },
    { tradeName: "Pulmicort", genericName: "Budesonide", strength: "0.5mg/2ml", dosageForm: "Nebulizer" },
    { tradeName: "Zyrtec", genericName: "Cetirizine", strength: "10mg", dosageForm: "Tablet" },
    { tradeName: "Cetrine", genericName: "Cetirizine", strength: "10mg", dosageForm: "Tablet" },
    { tradeName: "Telfast", genericName: "Fexofenadine", strength: "120mg", dosageForm: "Tablet" },
    { tradeName: "Clarinase", genericName: "Loratadine + Pseudoephedrine", strength: "10mg/120mg", dosageForm: "Tablet" },
    { tradeName: "Rhinocort", genericName: "Budesonide", strength: "64mcg", dosageForm: "Nasal Spray" },
    { tradeName: "Nasonex", genericName: "Mometasone", strength: "50mcg", dosageForm: "Nasal Spray" },
    { tradeName: "Mucosolvan", genericName: "Ambroxol", strength: "30mg/5ml", dosageForm: "Syrup" },
    { tradeName: "Mucomelt", genericName: "Acetylcysteine", strength: "600mg", dosageForm: "Effervescent Tablet" },
    { tradeName: "Tuscan", genericName: "Dextromethorphan", strength: "15mg/5ml", dosageForm: "Syrup" },

    // ── Neurology ────────────────────────────────────
    { tradeName: "Imigran", genericName: "Sumatriptan", strength: "50mg", dosageForm: "Tablet" },
    { tradeName: "Tegretol", genericName: "Carbamazepine", strength: "200mg", dosageForm: "Tablet" },
    { tradeName: "Epilim", genericName: "Sodium Valproate", strength: "200mg", dosageForm: "Tablet" },
    { tradeName: "Lyrica", genericName: "Pregabalin", strength: "75mg", dosageForm: "Capsule" },
    { tradeName: "Neurontin", genericName: "Gabapentin", strength: "300mg", dosageForm: "Capsule" },
    { tradeName: "Topamax", genericName: "Topiramate", strength: "25mg", dosageForm: "Tablet" },

    // ── Dermatology ──────────────────────────────────
    { tradeName: "Fucidin", genericName: "Fusidic Acid", strength: "2%", dosageForm: "Cream" },
    { tradeName: "Candistan", genericName: "Clotrimazole", strength: "1%", dosageForm: "Cream" },
    { tradeName: "Daktarin", genericName: "Miconazole", strength: "2%", dosageForm: "Cream" },
    { tradeName: "Diprosone", genericName: "Betamethasone", strength: "0.05%", dosageForm: "Cream" },
    { tradeName: "Locoid", genericName: "Hydrocortisone Butyrate", strength: "0.1%", dosageForm: "Cream" },
    { tradeName: "Elovera", genericName: "Aloe Vera + Vitamin E", strength: "-", dosageForm: "Cream" },
    { tradeName: "Isotrex", genericName: "Isotretinoin", strength: "0.05%", dosageForm: "Gel" },
    { tradeName: "Roaccutane", genericName: "Isotretinoin", strength: "20mg", dosageForm: "Capsule" },

    // ── Vitamins & Supplements ───────────────────────
    { tradeName: "Vitamin D3", genericName: "Cholecalciferol", strength: "50000IU", dosageForm: "Capsule" },
    { tradeName: "Calcium + Vitamin D3", genericName: "Calcium Carbonate + Vitamin D3", strength: "600mg/400IU", dosageForm: "Tablet" },
    { tradeName: "Ferrograd C", genericName: "Iron + Vitamin C", strength: "325mg", dosageForm: "Tablet" },
    { tradeName: "Haemojet", genericName: "Iron + Folic Acid + Vitamin B12", strength: "-", dosageForm: "Capsule" },
    { tradeName: "Neurobion", genericName: "Vitamin B1 + B6 + B12", strength: "-", dosageForm: "Tablet" },
    { tradeName: "Folic Acid", genericName: "Folic Acid", strength: "5mg", dosageForm: "Tablet" },
    { tradeName: "Omega 3", genericName: "Fish Oil", strength: "1000mg", dosageForm: "Capsule" },

    // ── Ophthalmology ────────────────────────────────
    { tradeName: "Tobrex", genericName: "Tobramycin", strength: "0.3%", dosageForm: "Eye Drop" },
    { tradeName: "Vigamox", genericName: "Moxifloxacin", strength: "0.5%", dosageForm: "Eye Drop" },
    { tradeName: "Tears Naturale", genericName: "Hypromellose", strength: "0.3%", dosageForm: "Eye Drop" },
    { tradeName: "FML", genericName: "Fluorometholone", strength: "0.1%", dosageForm: "Eye Drop" },

    // ── Urology ──────────────────────────────────────
    { tradeName: "Xatral", genericName: "Alfuzosin", strength: "10mg", dosageForm: "Tablet" },
    { tradeName: "Urotel", genericName: "Tolterodine", strength: "4mg", dosageForm: "Capsule" },
    { tradeName: "Macrobid", genericName: "Nitrofurantoin", strength: "100mg", dosageForm: "Capsule" },

    // ── Endocrine / Thyroid ──────────────────────────
    { tradeName: "Eltroxin", genericName: "Levothyroxine", strength: "50mcg", dosageForm: "Tablet" },
    { tradeName: "Carbimazole", genericName: "Carbimazole", strength: "5mg", dosageForm: "Tablet" },
    { tradeName: "Neomercazole", genericName: "Carbimazole", strength: "5mg", dosageForm: "Tablet" },

    // ── Psychiatry ───────────────────────────────────
    { tradeName: "Prozac", genericName: "Fluoxetine", strength: "20mg", dosageForm: "Capsule" },
    { tradeName: "Cipralex", genericName: "Escitalopram", strength: "10mg", dosageForm: "Tablet" },
    { tradeName: "Zoloft", genericName: "Sertraline", strength: "50mg", dosageForm: "Tablet" },
    { tradeName: "Xanax", genericName: "Alprazolam", strength: "0.25mg", dosageForm: "Tablet" },
    { tradeName: "Lexotanil", genericName: "Bromazepam", strength: "1.5mg", dosageForm: "Tablet" },
    { tradeName: "Valium", genericName: "Diazepam", strength: "5mg", dosageForm: "Tablet" },
    { tradeName: "Stilnox", genericName: "Zolpidem", strength: "10mg", dosageForm: "Tablet" },
  ]

  let medCount = 0
  for (const m of medications) {
    const existing = await prisma.medication.findFirst({
      where: { tradeName: m.tradeName, strength: m.strength }
    })
    if (!existing) {
      await prisma.medication.create({ data: m })
      medCount++
    }
  }
  console.log(`✅ Seeded ${medCount} Egyptian market medications`)

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