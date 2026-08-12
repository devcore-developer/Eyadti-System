import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    const tables = [
      { name: "allergy_dictionary", label: "AllergyDict" },
      { name: "diagnoses", label: "Diagnosis" },
      { name: "surgery_dictionary", label: "SurgeryDict" },
      { name: "complaints", label: "Complaint" },
      { name: "medications", label: "Medication" }
    ];
    
    for (const t of tables) {
      const res = await client.query(`SELECT COUNT(*) as count FROM ${t.name}`);
      console.log(`${t.label}: ${res.rows[0].count}`);
    }
    
    // اختبار بحث فعلي
    console.log("\n--- Test Search ---");
    const allergyTest = await client.query(`SELECT name FROM allergy_dictionary WHERE name ILIKE '%dust%' LIMIT 3`);
    console.log("Allergy 'dust':", allergyTest.rows.map(r => r.name));
    
    const diagTest = await client.query(`SELECT name FROM diagnoses WHERE name ILIKE '%diabetes%' LIMIT 3`);
    console.log("Diagnosis 'diabetes':", diagTest.rows.map(r => r.name));
    
    const surgTest = await client.query(`SELECT name FROM surgery_dictionary WHERE name ILIKE '%append%' LIMIT 3`);
    console.log("Surgery 'append':", surgTest.rows.map(r => r.name));
    
  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(e => { console.error(e); process.exit(1); });