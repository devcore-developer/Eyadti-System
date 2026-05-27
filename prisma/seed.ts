import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding medical dictionary & Egyptian drugs...")

  // ════════════════════════════════════════════════════
  // COMPLAINTS (50+ شكوى شائعة)
  // ════════════════════════════════════════════════════
  const complaints = [
    { name: "Headache", specialty: "Neurology" },
    { name: "Fever", specialty: "General" },
    { name: "Chest Pain", specialty: "Cardiology" },
    { name: "Abdominal Pain", specialty: "Gastroenterology" },
    { name: "Cough", specialty: "Pulmonology" },
    { name: "Shortness of Breath", specialty: "Pulmonology" },
    { name: "Dizziness", specialty: "Neurology" },
    { name: "Nausea", specialty: "Gastroenterology" },
    { name: "Vomiting", specialty: "Gastroenterology" },
    { name: "Diarrhea", specialty: "Gastroenterology" },
    { name: "Constipation", specialty: "Gastroenterology" },
    { name: "Fatigue", specialty: "General" },
    { name: "Back Pain", specialty: "Orthopedics" },
    { name: "Sore Throat", specialty: "ENT" },
    { name: "Joint Pain", specialty: "Rheumatology" },
    { name: "Skin Rash", specialty: "Dermatology" },
    { name: "Blurred Vision", specialty: "Ophthalmology" },
    { name: "Palpitation", specialty: "Cardiology" },
    { name: "Heartburn", specialty: "Gastroenterology" },
    { name: "Loss of Appetite", specialty: "General" },
    { name: "Weight Loss", specialty: "General" },
    { name: "Weight Gain", specialty: "Endocrinology" },
    { name: "Insomnia", specialty: "Psychiatry" },
    { name: "Anxiety", specialty: "Psychiatry" },
    { name: "Ear Pain", specialty: "ENT" },
    { name: "Nasal Congestion", specialty: "ENT" },
    { name: "Runny Nose", specialty: "ENT" },
    { name: "Itching", specialty: "Dermatology" },
    { name: "Burning Urination", specialty: "Urology" },
    { name: "Frequent Urination", specialty: "Urology" },
    { name: "Swelling of Legs", specialty: "Cardiology" },
    { name: "Numbness", specialty: "Neurology" },
    { name: "Tingling", specialty: "Neurology" },
    { name: "Muscle Weakness", specialty: "Neurology" },
    { name: "Toothache", specialty: "Dental" },
    { name: "Bleeding Gums", specialty: "Dental" },
    { name: "Hair Loss", specialty: "Dermatology" },
    { name: "Acne", specialty: "Dermatology" },
    { name: "Wheezing", specialty: "Pulmonology" },
    { name: "Knee Pain", specialty: "Orthopedics" },
    { name: "Neck Pain", specialty: "Orthopedics" },
    { name: "Shoulder Pain", specialty: "Orthopedics" },
    { name: "Eye Redness", specialty: "Ophthalmology" },
    { name: "Dry Eyes", specialty: "Ophthalmology" },
    { name: "Tinnitus", specialty: "ENT" },
    { name: "Hearing Loss", specialty: "ENT" },
    { name: "Chest Tightness", specialty: "Pulmonology" },
    { name: "Leg Pain", specialty: "Vascular" },
    { name: "Snoring", specialty: "ENT" },
    { name: "Excessive Sweating", specialty: "Endocrinology" },
  ]

  for (const c of complaints) {
    await prisma.complaintMaster.upsert({
      where: { name: c.name },
      update: { specialty: c.specialty },
      create: c,
    })
  }
  console.log(`✅ Seeded ${complaints.length} complaints`)

  // ════════════════════════════════════════════════════
  // DIAGNOSES (30+ تشخيص شائع)
  // ════════════════════════════════════════════════════
  const diagnoses = [
    { name: "Hypertension", specialty: "Cardiology" },
    { name: "Diabetes Mellitus Type 2", specialty: "Endocrinology" },
    { name: "Diabetes Mellitus Type 1", specialty: "Endocrinology" },
    { name: "Viral Infection", specialty: "Infectious Disease" },
    { name: "Gastritis", specialty: "Gastroenterology" },
    { name: "Asthma", specialty: "Pulmonology" },
    { name: "Migraine", specialty: "Neurology" },
    { name: "Urinary Tract Infection", specialty: "Urology" },
    { name: "Allergic Rhinitis", specialty: "ENT" },
    { name: "Acne Vulgaris", specialty: "Dermatology" },
    { name: "Anemia", specialty: "Hematology" },
    { name: "Osteoarthritis", specialty: "Orthopedics" },
    { name: "Anxiety Disorder", specialty: "Psychiatry" },
    { name: "Gastroesophageal Reflux Disease", specialty: "Gastroenterology" },
    { name: "Common Cold", specialty: "General" },
    { name: "Acute Bronchitis", specialty: "Pulmonology" },
    { name: "Pneumonia", specialty: "Pulmonology" },
    { name: "Sinusitis", specialty: "ENT" },
    { name: "Pharyngitis", specialty: "ENT" },
    { name: "Tonsillitis", specialty: "ENT" },
    { name: "Conjunctivitis", specialty: "Ophthalmology" },
    { name: "Otitis Media", specialty: "ENT" },
    { name: "Eczema", specialty: "Dermatology" },
    { name: "Psoriasis", specialty: "Dermatology" },
    { name: "Hypothyroidism", specialty: "Endocrinology" },
    { name: "Hyperthyroidism", specialty: "Endocrinology" },
    { name: "Chronic Kidney Disease", specialty: "Nephrology" },
    { name: "Sciatica", specialty: "Orthopedics" },
    { name: "Cervical Spondylosis", specialty: "Orthopedics" },
    { name: "Irritable Bowel Syndrome", specialty: "Gastroenterology" },
    { name: "Peptic Ulcer Disease", specialty: "Gastroenterology" },
    { name: "Atrial Fibrillation", specialty: "Cardiology" },
    { name: "Heart Failure", specialty: "Cardiology" },
    { name: "Depression", specialty: "Psychiatry" },
    { name: "Insomnia Disorder", specialty: "Psychiatry" },
  ]

  for (const d of diagnoses) {
    await prisma.diagnosisMaster.upsert({
      where: { name: d.name },
      update: { specialty: d.specialty },
      create: d,
    })
  }
  console.log(`✅ Seeded ${diagnoses.length} diagnoses`)

  // ════════════════════════════════════════════════════
  // EGYPTIAN DRUG DATABASE (100+ دواء)
  // ════════════════════════════════════════════════════
  const drugs = [
    // ── Analgesics & Antipyretics ────────────────────
    { name: "Panadol", genericName: "Paracetamol", category: "Analgesic", form: "Tablet", dosage: "500mg", notes: "After meals" },
    { name: "Panadol Extra", genericName: "Paracetamol + Caffeine", category: "Analgesic", form: "Tablet", dosage: "500mg/65mg", notes: "For headache" },
    { name: "Panadol Cold & Flu", genericName: "Paracetamol + Pseudoephedrine + Chlorpheniramine", category: "Cold & Flu", form: "Tablet", dosage: "500mg/30mg/2mg", notes: "For cold symptoms" },
    { name: "Brufen", genericName: "Ibuprofen", category: "NSAID", form: "Tablet", dosage: "400mg", notes: "After meals" },
    { name: "Cataflam", genericName: "Diclofenac Potassium", category: "NSAID", form: "Tablet", dosage: "50mg", notes: "After meals" },
    { name: "Voltaren", genericName: "Diclofenac Sodium", category: "NSAID", form: "Tablet", dosage: "50mg", notes: "After meals" },
    { name: "Mobic", genericName: "Meloxicam", category: "NSAID", form: "Tablet", dosage: "15mg", notes: "Once daily" },
    { name: "Celebrex", genericName: "Celecoxib", category: "NSAID", form: "Capsule", dosage: "200mg", notes: "With food" },
    { name: "Solpadeine", genericName: "Paracetamol + Codeine + Caffeine", category: "Analgesic", form: "Tablet", dosage: "500mg/8mg/30mg", notes: "For severe pain" },
    { name: "Tramal", genericName: "Tramadol", category: "Opioid Analgesic", form: "Capsule", dosage: "50mg", notes: "Prescription only" },

    // ── Antibiotics ──────────────────────────────────
    { name: "Augmentin", genericName: "Amoxicillin + Clavulanate", category: "Antibiotic", form: "Tablet", dosage: "1g/125mg", notes: "After meals, 12 hourly" },
    { name: "Amoxil", genericName: "Amoxicillin", category: "Antibiotic", form: "Capsule", dosage: "500mg", notes: "8 hourly" },
    { name: "Zithromax", genericName: "Azithromycin", category: "Antibiotic", form: "Tablet", dosage: "500mg", notes: "Once daily for 3-5 days" },
    { name: "Ciprobay", genericName: "Ciprofloxacin", category: "Antibiotic", form: "Tablet", dosage: "500mg", notes: "12 hourly, avoid dairy" },
    { name: "Keflex", genericName: "Cephalexin", category: "Antibiotic", form: "Capsule", dosage: "500mg", notes: "8 hourly" },
    { name: "Flagyl", genericName: "Metronidazole", category: "Antibiotic", form: "Tablet", dosage: "500mg", notes: "8 hourly, no alcohol" },
    { name: "Erythrocin", genericName: "Erythromycin", category: "Antibiotic", form: "Tablet", dosage: "500mg", notes: "6 hourly, before meals" },
    { name: "Doxymycin", genericName: "Doxycycline", category: "Antibiotic", form: "Capsule", dosage: "100mg", notes: "12 hourly, with water, avoid sun" },
    { name: "Bactrim", genericName: "Trimethoprim + Sulfamethoxazole", category: "Antibiotic", form: "Tablet", dosage: "160mg/800mg", notes: "12 hourly, plenty of water" },
    { name: "Rocephin", genericName: "Ceftriaxone", category: "Antibiotic", form: "Injection", dosage: "1g", notes: "IV/IM once daily" },
    { name: "Unasyn", genericName: "Ampicillin + Sulbactam", category: "Antibiotic", form: "Injection", dosage: "1.5g", notes: "IV 8 hourly" },
    { name: "Tavanic", genericName: "Levofloxacin", category: "Antibiotic", form: "Tablet", dosage: "500mg", notes: "Once daily" },

    // ── Gastrointestinal ─────────────────────────────
    { name: "Losec", genericName: "Omeprazole", category: "PPI", form: "Capsule", dosage: "20mg", notes: "Before breakfast, 30 min before food" },
    { name: "Nexium", genericName: "Esomeprazole", category: "PPI", form: "Tablet", dosage: "40mg", notes: "Before breakfast" },
    { name: "Controloc", genericName: "Pantoprazole", category: "PPI", form: "Tablet", dosage: "40mg", notes: "Before breakfast" },
    { name: "Motilium", genericName: "Domperidone", category: "Anti-emetic", form: "Tablet", dosage: "10mg", notes: "Before meals, 3 times daily" },
    { name: "Maxolon", genericName: "Metoclopramide", category: "Anti-emetic", form: "Tablet", dosage: "10mg", notes: "Before meals" },
    { name: "Antacid", genericName: "Aluminium Hydroxide + Magnesium Hydroxide", category: "Antacid", form: "Syrup", dosage: "15ml", notes: "After meals" },
    { name: "Maalox", genericName: "Aluminium Hydroxide + Magnesium Hydroxide", category: "Antacid", form: "Syrup", dosage: "15ml", notes: "After meals" },
    { name: "Flagyl", genericName: "Metronidazole", category: "Antiprotozoal", form: "Tablet", dosage: "500mg", notes: "8 hourly, no alcohol" },
    { name: "Loperamide", genericName: "Loperamide HCl", category: "Antidiarrheal", form: "Capsule", dosage: "2mg", notes: "After first loose stool, then 2mg after each subsequent" },
    { name: "Imodium", genericName: "Loperamide HCl", category: "Antidiarrheal", form: "Capsule", dosage: "2mg", notes: "After first loose stool" },
    { name: "Duspatalin", genericName: "Mebeverine", category: "Antispasmodic", form: "Tablet", dosage: "135mg", notes: "Before meals, 3 times daily" },
    { name: "Buscopan", genericName: "Hyoscine Butylbromide", category: "Antispasmodic", form: "Tablet", dosage: "10mg", notes: "3 times daily" },
    { name: "Lactulose", genericName: "Lactulose", category: "Laxative", form: "Syrup", dosage: "15ml", notes: "Once or twice daily" },
    { name: "Duphalac", genericName: "Lactulose", category: "Laxative", form: "Syrup", dosage: "15ml", notes: "Once or twice daily" },
    { name: "Creon", genericName: "Pancreatin", category: "Digestive Enzyme", form: "Capsule", dosage: "10000IU", notes: "With meals" },

    // ── Cardiovascular ───────────────────────────────
    { name: "Concor", genericName: "Bisoprolol", category: "Beta Blocker", form: "Tablet", dosage: "5mg", notes: "Once daily in the morning" },
    { name: "Betaloc", genericName: "Metoprolol", category: "Beta Blocker", form: "Tablet", dosage: "50mg", notes: "Once or twice daily" },
    { name: "Norvasc", genericName: "Amlodipine", category: "Calcium Channel Blocker", form: "Tablet", dosage: "5mg", notes: "Once daily" },
    { name: "Amlor", genericName: "Amlodipine", category: "Calcium Channel Blocker", form: "Tablet", dosage: "10mg", notes: "Once daily" },
    { name: "Zestril", genericName: "Lisinopril", category: "ACE Inhibitor", form: "Tablet", dosage: "10mg", notes: "Once daily" },
    { name: "Capoten", genericName: "Captopril", category: "ACE Inhibitor", form: "Tablet", dosage: "25mg", notes: "2-3 times daily, before meals" },
    { name: "Cozaar", genericName: "Losartan", category: "ARB", form: "Tablet", dosage: "50mg", notes: "Once daily" },
    { name: "Diovan", genericName: "Valsartan", category: "ARB", form: "Tablet", dosage: "160mg", notes: "Once daily" },
    { name: "Aspirin Protect", genericName: "Aspirin", category: "Antiplatelet", form: "Tablet", dosage: "100mg", notes: "After meals, once daily" },
    { name: "Plavix", genericName: "Clopidogrel", category: "Antiplatelet", form: "Tablet", dosage: "75mg", notes: "Once daily" },
    { name: "Corvedilol", genericName: "Carvedilol", category: "Beta Blocker", form: "Tablet", dosage: "12.5mg", notes: "Twice daily with food" },
    { name: "Aldactone", genericName: "Spironolactone", category: "Potassium Sparing Diuretic", form: "Tablet", dosage: "25mg", notes: "Once daily" },
    { name: "Lasix", genericName: "Furosemide", category: "Loop Diuretic", form: "Tablet", dosage: "40mg", notes: "Once daily in the morning" },
    { name: "Isordil", genericName: "Isosorbide Dinitrate", category: "Vasodilator", form: "Tablet", dosage: "5mg", notes: "Sublingual for chest pain" },
    { name: "Nitroglycerin", genericName: "Nitroglycerin", category: "Vasodilator", form: "Spray", dosage: "0.4mg/spray", notes: "Sublingual for acute chest pain" },

    // ── Diabetes ─────────────────────────────────────
    { name: "Glucophage", genericName: "Metformin", category: "Antidiabetic", form: "Tablet", dosage: "500mg", notes: "With or after meals, twice daily" },
    { name: "Glucophage XR", genericName: "Metformin", category: "Antidiabetic", form: "Tablet", dosage: "850mg", notes: "Once daily with dinner" },
    { name: "Amaryl", genericName: "Glimepiride", category: "Antidiabetic", form: "Tablet", dosage: "2mg", notes: "Once daily with breakfast" },
    { name: "Daonil", genericName: "Glibenclamide", category: "Antidiabetic", form: "Tablet", dosage: "5mg", notes: "Once daily with breakfast" },
    { name: "Januvia", genericName: "Sitagliptin", category: "Antidiabetic", form: "Tablet", dosage: "100mg", notes: "Once daily" },
    { name: "Galvus", genericName: "Vildagliptin", category: "Antidiabetic", form: "Tablet", dosage: "50mg", notes: "Twice daily" },
    { name: "Novomix 30", genericName: "Insulin Aspart", category: "Insulin", form: "Injection Pen", dosage: "100IU/ml", notes: "Twice daily, before meals" },
    { name: "Lantus", genericName: "Insulin Glargine", category: "Insulin", form: "Injection Pen", dosage: "100IU/ml", notes: "Once daily at bedtime" },

    // ── Respiratory / Asthma & Allergy ───────────────
    { name: "Ventolin", genericName: "Salbutamol", category: "Bronchodilator", form: "Inhaler", dosage: "100mcg/puff", notes: "2 puffs PRN" },
    { name: "Symbicort", genericName: "Budesonide + Formoterol", category: "Corticosteroid + Bronchodilator", form: "Inhaler", dosage: "160/4.5mcg", notes: "2 puffs twice daily" },
    { name: "Seretide", genericName: "Fluticasone + Salmeterol", category: "Corticosteroid + Bronchodilator", form: "Inhaler", dosage: "125/25mcg", notes: "2 puffs twice daily" },
    { name: "Pulmicort", genericName: "Budesonide", category: "Corticosteroid", form: "Nebulizer", dosage: "0.5mg/2ml", notes: "Once or twice daily" },
    { name: "Zyrtec", genericName: "Cetirizine", category: "Antihistamine", form: "Tablet", dosage: "10mg", notes: "Once daily" },
    { name: "Cetrine", genericName: "Cetirizine", category: "Antihistamine", form: "Tablet", dosage: "10mg", notes: "Once daily" },
    { name: "Telfast", genericName: "Fexofenadine", category: "Antihistamine", form: "Tablet", dosage: "120mg", notes: "Once daily" },
    { name: "Clarinase", genericName: "Loratadine + Pseudoephedrine", category: "Antihistamine + Decongestant", form: "Tablet", dosage: "10mg/120mg", notes: "Once daily" },
    { name: "Rhinocort", genericName: "Budesonide", category: "Nasal Corticosteroid", form: "Nasal Spray", dosage: "64mcg", notes: "2 sprays each nostril once daily" },
    { name: "Nasonex", genericName: "Mometasone", category: "Nasal Corticosteroid", form: "Nasal Spray", dosage: "50mcg", notes: "2 sprays each nostril once daily" },
    { name: "Mucosolvan", genericName: "Ambroxol", category: "Mucolytic", form: "Syrup", dosage: "30mg/5ml", notes: "3 times daily" },
    { name: "Mucomelt", genericName: "Acetylcysteine", category: "Mucolytic", form: "Effervescent Tablet", dosage: "600mg", notes: "Once daily" },
    { name: "Tuscan", genericName: "Dextromethorphan", category: "Antitussive", form: "Syrup", dosage: "15mg/5ml", notes: "3 times daily" },

    // ── Neurology ────────────────────────────────────
    { name: "Imigran", genericName: "Sumatriptan", category: "Antimigraine", form: "Tablet", dosage: "50mg", notes: "At migraine onset, max 2 doses/day" },
    { name: "Tegretol", genericName: "Carbamazepine", category: "Anticonvulsant", form: "Tablet", dosage: "200mg", notes: "Twice daily" },
    { name: "Epilim", genericName: "Sodium Valproate", category: "Anticonvulsant", form: "Tablet", dosage: "200mg", notes: "Twice daily" },
    { name: "Lyrica", genericName: "Pregabalin", category: "Anticonvulsant/Neuropathic", form: "Capsule", dosage: "75mg", notes: "Twice daily" },
    { name: "Neurontin", genericName: "Gabapentin", category: "Neuropathic Pain", form: "Capsule", dosage: "300mg", notes: "3 times daily" },
    { name: "Topamax", genericName: "Topiramate", category: "Anticonvulsant/Migraine Prevention", form: "Tablet", dosage: "25mg", notes: "Gradually increase dose" },

    // ── Dermatology ──────────────────────────────────
    { name: "Fucidin", genericName: "Fusidic Acid", category: "Topical Antibiotic", form: "Cream", dosage: "2%", notes: "Apply 3 times daily" },
    { name: "Candistan", genericName: "Clotrimazole", category: "Antifungal", form: "Cream", dosage: "1%", notes: "Apply twice daily" },
    { name: "Daktarin", genericName: "Miconazole", category: "Antifungal", form: "Cream", dosage: "2%", notes: "Apply twice daily" },
    { name: "Diprosone", genericName: "Betamethasone", category: "Topical Corticosteroid", form: "Cream", dosage: "0.05%", notes: "Apply once or twice daily" },
    { name: "Locoid", genericName: "Hydrocortisone Butyrate", category: "Topical Corticosteroid", form: "Cream", dosage: "0.1%", notes: "Apply once or twice daily" },
    { name: "Elovera", genericName: "Aloe Vera + Vitamin E", category: "Moisturizer", form: "Cream", dosage: "-", notes: "Apply as needed" },
    { name: "Isotrex", genericName: "Isotretinoin", category: "Anti-acne", form: "Gel", dosage: "0.05%", notes: "Apply at night" },
    { name: "Roaccutane", genericName: "Isotretinoin", category: "Anti-acne (Systemic)", form: "Capsule", dosage: "20mg", notes: "Once daily with food, pregnancy test required" },

    // ── Vitamins & Supplements ───────────────────────
    { name: "Vitamin D3", genericName: "Cholecalciferol", category: "Vitamin", form: "Capsule", dosage: "50000IU", notes: "Once weekly for 8 weeks" },
    { name: "Calcium + Vitamin D3", genericName: "Calcium Carbonate + Vitamin D3", category: "Supplement", form: "Tablet", dosage: "600mg/400IU", notes: "Once or twice daily" },
    { name: "Ferrograd C", genericName: "Iron + Vitamin C", category: "Iron Supplement", form: "Tablet", dosage: "325mg", notes: "Once daily, before breakfast" },
    { name: "Haemojet", genericName: "Iron + Folic Acid + Vitamin B12", category: "Iron Supplement", form: "Capsule", dosage: "-", notes: "Once daily" },
    { name: "Neurobion", genericName: "Vitamin B1 + B6 + B12", category: "Vitamin B Complex", form: "Tablet", dosage: "-", notes: "Once or twice daily" },
    { name: "Folic Acid", genericName: "Folic Acid", category: "Vitamin", form: "Tablet", dosage: "5mg", notes: "Once daily" },
    { name: "Omega 3", genericName: "Fish Oil", category: "Supplement", form: "Capsule", dosage: "1000mg", notes: "Once or twice daily" },

    // ── Ophthalmology ────────────────────────────────
    { name: "Tobrex", genericName: "Tobramycin", category: "Antibiotic Eye Drop", form: "Eye Drop", dosage: "0.3%", notes: "1-2 drops every 4 hours" },
    { name: "Vigamox", genericName: "Moxifloxacin", category: "Antibiotic Eye Drop", form: "Eye Drop", dosage: "0.5%", notes: "1 drop 3 times daily" },
    { name: "Tears Naturale", genericName: "Hypromellose", category: "Artificial Tears", form: "Eye Drop", dosage: "0.3%", notes: "As needed" },
    { name: "FML", genericName: "Fluorometholone", category: "Steroid Eye Drop", form: "Eye Drop", dosage: "0.1%", notes: "1 drop 4 times daily" },

    // ── Urology ──────────────────────────────────────
    { name: "Xatral", genericName: "Alfuzosin", category: "Alpha Blocker", form: "Tablet", dosage: "10mg", notes: "Once daily after meal" },
    { name: "Urotel", genericName: "Tolterodine", category: "Antimuscarinic", form: "Capsule", dosage: "4mg", notes: "Once daily" },
    { name: "Macrobid", genericName: "Nitrofurantoin", category: "Antibiotic", form: "Capsule", dosage: "100mg", notes: "Twice daily for 5 days" },

    // ── Endocrine / Thyroid ──────────────────────────
    { name: "Eltroxin", genericName: "Levothyroxine", category: "Thyroid Hormone", form: "Tablet", dosage: "50mcg", notes: "Once daily on empty stomach, 30 min before breakfast" },
    { name: "Carbimazole", genericName: "Carbimazole", category: "Antithyroid", form: "Tablet", dosage: "5mg", notes: "Once or twice daily" },
    { name: "Neomercazole", genericName: "Carbimazole", category: "Antithyroid", form: "Tablet", dosage: "5mg", notes: "Once or twice daily" },

    // ── Psychiatry ───────────────────────────────────
    { name: "Prozac", genericName: "Fluoxetine", category: "SSRI Antidepressant", form: "Capsule", dosage: "20mg", notes: "Once daily in the morning" },
    { name: "Cipralex", genericName: "Escitalopram", category: "SSRI Antidepressant", form: "Tablet", dosage: "10mg", notes: "Once daily" },
    { name: "Zoloft", genericName: "Sertraline", category: "SSRI Antidepressant", form: "Tablet", dosage: "50mg", notes: "Once daily" },
    { name: "Xanax", genericName: "Alprazolam", category: "Anxiolytic (Benzodiazepine)", form: "Tablet", dosage: "0.25mg", notes: "PRN, max short-term use" },
    { name: "Lexotanil", genericName: "Bromazepam", category: "Anxiolytic (Benzodiazepine)", form: "Tablet", dosage: "1.5mg", notes: "PRN or twice daily" },
    { name: "Valium", genericName: "Diazepam", category: "Anxiolytic (Benzodiazepine)", form: "Tablet", dosage: "5mg", notes: "PRN" },
    { name: "Stilnox", genericName: "Zolpidem", category: "Hypnotic", form: "Tablet", dosage: "10mg", notes: "At bedtime only" },
  ]

  let drugCount = 0
  for (const d of drugs) {
    const existing = await prisma.drugMaster.findFirst({
      where: { name: d.name, dosage: d.dosage },
    })
    if (!existing) {
      await prisma.drugMaster.create({ data: d })
      drugCount++
    }
  }
  console.log(`✅ Seeded ${drugCount} Egyptian market drugs`)

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