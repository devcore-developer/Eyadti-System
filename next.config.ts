import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ↓↓↓ أضف الكود ده عشان يتجاوز خطأ الـ Prisma وقت البناء ↓↓↓
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_nHumTDN5dL4p@ep-divine-meadow-aqa26gum-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require",
  },
};

export default nextConfig;