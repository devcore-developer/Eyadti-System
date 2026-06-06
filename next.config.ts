import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ↓↓↓ أضف الكود ده جوه الـ Config ↓↓↓
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy",
  },
};

export default nextConfig;