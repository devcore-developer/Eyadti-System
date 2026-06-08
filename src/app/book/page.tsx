import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"

export default async function BookRootPage() {
  // لو حد دخل على /book من غير slug، بنوجهه لأول عيادة موجودة في السيستم
  const clinic = await prisma.clinic.findFirst({
    where: { slug: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { slug: true }
  })

  if (clinic?.slug) {
    redirect(`/book/${clinic.slug}`)
  }

  // Fallback لو مفيش عيادات ليها slug
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>No clinics available for booking yet.</p>
    </div>
  )
}