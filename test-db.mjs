import { Pool } from "pg";

console.log("⏳ Testing connection to Neon...");

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error("🔴 CONNECTION FAILED:", err.message);
  } else {
    console.log("🟢 SUCCESS! Connected to Neon at:", res.rows[0].now);
  }
  pool.end();
});