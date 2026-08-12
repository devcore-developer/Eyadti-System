import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function readCSV(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️ File not found: ${fullPath}`);
    return [];
  }
  const content = fs.readFileSync(fullPath, "utf-8").replace(/^\uFEFF/, "");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ════════════════════════════════════════════════════
    // 1. ALLERGIES
    // ════════════════════════════════════════════════════
    console.log("🌱 Seeding Allergies from CSV...");

    // Hardcoded fallback
    const fallbackAllergies = [
      { name: "Penicillin", category: "Drug" },
      { name: "Amoxicillin", category: "Drug" },
      { name: "Latex", category: "Environmental" },
      { name: "Dust", category: "Environmental" },
      { name: "Dust Mites", category: "Environmental" },
      { name: "Peanut", category: "Food" },
      { name: "Shellfish", category: "Food" },
      { name: "Milk", category: "Food" },
      { name: "Egg", category: "Food" },
      { name: "Gluten", category: "Food" },
      { name: "Cat Dander", category: "Environmental" },
      { name: "Pollen", category: "Environmental" },
      { name: "Ibuprofen", category: "Drug" },
      { name: "Aspirin", category: "Drug" },
      { name: "Sulfonamides", category: "Drug" },
      { name: "Bee Sting", category: "Insect" },
      { name: "Wasp Sting", category: "Insect" },
      { name: "Mold", category: "Environmental" },
      { name: "Dog Dander", category: "Environmental" },
      { name: "Tree Nuts", category: "Food" },
    ];

    const allergiesCSV = readCSV("prisma/data/allergies_dictionary.csv");
    
    // Merge: CSV + fallback
    const allergyMap = new Map();
    
    for (const row of allergiesCSV) {
      const name = (row.name || row.Name || row.Allergy || "").trim();
      const category = (row.category || row.Category || row.Type || "Unknown").trim();
      if (name.length > 0) {
        allergyMap.set(name.toLowerCase(), { name, category });
      }
    }
    
    for (const a of fallbackAllergies) {
      if (!allergyMap.has(a.name.toLowerCase())) {
        allergyMap.set(a.name.toLowerCase(), a);
      }
    }

    let allergyCount = 0;
    for (const [, a] of allergyMap) {
      await client.query(
        `INSERT INTO allergy_dictionary (id, name, category, "createdAt") 
         VALUES (gen_random_uuid(), $1, $2, NOW()) 
         ON CONFLICT (name) DO NOTHING`,
        [a.name, a.category]
      );
      allergyCount++;
    }
    console.log(`  ✅ ${allergyCount} allergies processed`);

    // ════════════════════════════════════════════════════
    // 2. DIAGNOSES
    // ════════════════════════════════════════════════════
    console.log("🌱 Seeding Diagnoses from CSV files...");

    const diagMap = new Map();

    // Read diagnoses.csv
    const diagnosesCSV = readCSV("prisma/data/diagnoses.csv");
    for (const row of diagnosesCSV) {
      const name = (row.name || row.Name || row.Disease || row.definition || "").trim();
      const icd10 = (row.icd10_code || row.icd10Code || row.code || row["sub-code"] || "").trim();
      if (name.length > 1) {
        diagMap.set(name.toLowerCase(), { name, icd10: icd10 || null });
      }
    }

    // Read icd10-details.csv
    const icd10CSV = readCSV("prisma/data/icd10-details.csv");
    for (const row of icd10CSV) {
      const name = (row.definition || row.name || "").replace(/(\r\n|\n|\r)/gm, " ").trim();
      const icd10 = (row["sub-code"] || row.code || "").trim();
      if (name.length > 1 && !diagMap.has(name.toLowerCase())) {
        diagMap.set(name.toLowerCase(), { name, icd10: icd10 || null });
      }
    }

    // Read head-codes.csv
    const headCodesCSV = readCSV("prisma/data/head-codes.csv");
    for (const row of headCodesCSV) {
      const name = (row.name || "").trim();
      const icd10 = (row.head_code || row.code || "").trim();
      if (name.length > 1 && !diagMap.has(name.toLowerCase())) {
        diagMap.set(name.toLowerCase(), { name, icd10: icd10 || null });
      }
    }

    // Read disease-precautions.csv
    const precautionsCSV = readCSV("prisma/data/disease-precautions.csv");
    for (const row of precautionsCSV) {
      const name = (row.Disease || row.disease || row.name || "").trim();
      if (name.length > 1 && !diagMap.has(name.toLowerCase())) {
        diagMap.set(name.toLowerCase(), { name, icd10: null });
      }
    }

    let diagCount = 0;
    for (const [, d] of diagMap) {
      await client.query(
        `INSERT INTO diagnoses (id, name, "icd10Code", "createdAt") 
         VALUES (gen_random_uuid(), $1, $2, NOW()) 
         ON CONFLICT (name) DO NOTHING`,
        [d.name, d.icd10]
      );
      diagCount++;
    }
    console.log(`  ✅ ${diagCount} diagnoses processed`);

    // ════════════════════════════════════════════════════
    // 3. SURGICAL PROCEDURES
    // ════════════════════════════════════════════════════
    console.log("🌱 Seeding Surgical Procedures from CSV...");

    const surgeryMap = new Map();

    // Read surgical_procedures.csv (handle both CSV and non-CSV formats)
    const surgPath = path.join(process.cwd(), "prisma/data/surgical_procedures.csv");
    
    if (fs.existsSync(surgPath)) {
      const content = fs.readFileSync(surgPath, "utf-8").replace(/^\uFEFF/, "");
      
      // Try parsing as standard CSV first
      try {
        const surgCSV = parse(content, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
        
        for (const row of surgCSV) {
          // Try different possible column names
          const name = (
            row.name || 
            row.Name || 
            row.Procedure || 
            row.procedure || 
            row["Procedure Name"] ||
            ""
          ).trim().replace(/^"|"$/g, "");
          
          const specialty = (
            row.specialty || 
            row.Specialty || 
            row.Department || 
            row.department ||
            ""
          ).trim().replace(/^"|"$/g, "");
          
          if (name.length > 1) {
            surgeryMap.set(name.toLowerCase(), { name, specialty: specialty || null });
          }
        }
      } catch (e) {
        // If CSV parsing fails, try line-by-line parsing
        console.log("  ⚠️ CSV parse failed, trying line-by-line...");
        const lines = content.split(/\r?\n/).filter(l => l.trim() !== "");
        
        if (lines.length > 1) {
          // Detect delimiter
          const firstLine = lines[0];
          const delimiter = firstLine.includes('\t') ? '\t' : ',';
          const headers = firstLine.split(delimiter).map(h => h.replace(/^"|"$/g, "").trim());
          
          // Find name and specialty column indices
          let nameIdx = headers.findIndex(h => 
            h.toLowerCase().includes("name") || 
            h.toLowerCase().includes("procedure")
          );
          let specIdx = headers.findIndex(h => 
            h.toLowerCase().includes("specialty") || 
            h.toLowerCase().includes("department")
          );
          
          if (nameIdx === -1) nameIdx = 1; // Common fallback
          if (specIdx === -1) specIdx = 2;  // Common fallback
          
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(delimiter);
            const name = (parts[nameIdx] || "").replace(/^"|"$/g, "").trim();
            const specialty = (parts[specIdx] || "").replace(/^"|"$/g, "").trim();
            
            if (name.length > 1) {
              surgeryMap.set(name.toLowerCase(), { name, specialty: specialty || null });
            }
          }
        }
      }
    }

    // Hardcoded fallback for common surgeries
    const fallbackSurgeries = [
      { name: "Appendectomy", specialty: "General Surgery" },
      { name: "Cholecystectomy", specialty: "General Surgery" },
      { name: "Hernia Repair", specialty: "General Surgery" },
      { name: "Total Knee Replacement", specialty: "Orthopedics" },
      { name: "Total Hip Replacement", specialty: "Orthopedics" },
      { name: "C-Section", specialty: "Gynecology" },
      { name: "Cesarean Section", specialty: "Gynecology" },
      { name: "Tonsillectomy", specialty: "ENT" },
      { name: "Cataract Surgery", specialty: "Ophthalmology" },
      { name: "Coronary Artery Bypass", specialty: "Cardiovascular" },
    ];
    
    for (const s of fallbackSurgeries) {
      if (!surgeryMap.has(s.name.toLowerCase())) {
        surgeryMap.set(s.name.toLowerCase(), s);
      }
    }

    let surgCount = 0;
    for (const [, s] of surgeryMap) {
      await client.query(
        `INSERT INTO surgery_dictionary (id, name, specialty, "createdAt") 
         VALUES (gen_random_uuid(), $1, $2, NOW()) 
         ON CONFLICT (name) DO NOTHING`,
        [s.name, s.specialty]
      );
      surgCount++;
    }
    console.log(`  ✅ ${surgCount} surgical procedures processed`);

    await client.query("COMMIT");
    console.log("\n🎉 All CSV data seeded successfully!");

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();