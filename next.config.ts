import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // هذا الإعداد يمنع Next.js من دمج Prisma و pg داخل الـ Serverless Functions بشكل خاطئ
  // ويجعلها تعمل كـ External Packages وهو المطلوب لقواعد بيانات Neon
  serverExternalPackages: ["@prisma/client", "prisma", "pg", "@prisma/adapter-pg"],
};

export default nextConfig;