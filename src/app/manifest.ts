import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eyadti Clinic Pro",
    short_name: "Eyadti",
    description: "Premium Medical & Clinic Management System",
    // مهم جداً: بيخفي شريط المتصفح ويخليه يشتغل زي Native App
    display: "standalone", 
    orientation: "portrait",
    background_color: "#F7FBFF", // لون خلفية شاشة التحميل
    theme_color: "#5BC0BE", // لون الـ Status Bar
    start_url: "/",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable", // عشان الأيقونة تملأ الشاشة على الأندرويد من غير حدود بيضا
      },
    ],
  }
}