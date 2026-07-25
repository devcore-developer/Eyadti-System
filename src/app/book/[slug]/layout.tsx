import type { Metadata } from "next";
import "../../globals.css"; 
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

// ⚠️ شلنا استدعاء الفونت (Cairo) عشان مفيش تعارض مع الـ Root Layout

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: { name: true, address: true },
  });

  if (!clinic) return { title: "Clinic Not Found" };

  return {
    title: `Book Appointment at ${clinic.name}`,
    description: `Schedule your visit to ${clinic.name} located at ${clinic.address}. Professional healthcare services.`,
    openGraph: {
      title: `Book at ${clinic.name}`,
      description: `Book your appointment online now.`,
      type: "website",
    },
  };
}

export default async function PublicBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ⚠️ شلنا <html> و <body> وحطيناهم كـ <div> عادي
    <div className="font-sans antialiased bg-gradient-to-br from-slate-50 to-slate-200 min-h-screen selection:bg-teal-200 selection:text-teal-900">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Main Container with Mobile Constraints */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md mx-auto">{children}</div>
      </main>
    </div>
  );
}