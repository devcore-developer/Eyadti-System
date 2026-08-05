import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// ─── GET ─────────────────────────────────────────────
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const testimonials = await prisma.testimonial.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(testimonials)
  } catch (error) {
    console.error("Error fetching testimonials:", error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

// ─── POST ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, clinicName, position, photoUrl, review, rating, isPublished, displayOrder } = body

    // ⭐ Validation صارم
    if (!name || !clinicName || !review) {
      return NextResponse.json(
        { error: "Name, clinic name, and review are required." },
        { status: 400 }
      )
    }

    const parsedRating = Number(rating)
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5." },
        { status: 400 }
      )
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        name: String(name).trim(),
        clinicName: String(clinicName).trim(),
        position: position ? String(position).trim() : null,
        photoUrl: photoUrl ? String(photoUrl).trim() : null,
        review: String(review).trim(),
        rating: parsedRating,
        isPublished: Boolean(isPublished),
        displayOrder: Number(displayOrder) || 0,
        createdById: session.user.id,
      },
    })

    revalidatePath("/super-admin/testimonials")
    return NextResponse.json(testimonial, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating testimonial:", error)
    const message = error instanceof Error ? error.message : "Failed to create"
    // ⭐ لو الخطأ من Prisma، نرجع رسالة نظيفة بدل الـ stack trace
    if (message.includes("prisma")) {
      return NextResponse.json({ error: "Database error. Please check your data and try again." }, { status: 500 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── PUT ────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: "Testimonial ID is required." }, { status: 400 })
    }

    const existing = await prisma.testimonial.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Testimonial not found." }, { status: 404 })
    }

    // ⭐ نوع الآمن لكل حقل
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = String(data.name).trim()
    if (data.clinicName !== undefined) updateData.clinicName = String(data.clinicName).trim()
    if (data.position !== undefined) updateData.position = data.position ? String(data.position).trim() : null
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl ? String(data.photoUrl).trim() : null
    if (data.review !== undefined) updateData.review = String(data.review).trim()
    if (data.rating !== undefined) updateData.rating = Number(data.rating)
    if (data.isPublished !== undefined) updateData.isPublished = Boolean(data.isPublished)
    if (data.displayOrder !== undefined) updateData.displayOrder = Number(data.displayOrder)

    const updated = await prisma.testimonial.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/super-admin/testimonials")
    return NextResponse.json(updated)
  } catch (error: unknown) {
    console.error("Error updating testimonial:", error)
    const message = error instanceof Error ? error.message : "Failed to update"
    if (message.includes("prisma")) {
      return NextResponse.json({ error: "Database error. Please check your data and try again." }, { status: 500 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── DELETE ─────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Testimonial ID is required." }, { status: 400 })
    }

    await prisma.testimonial.delete({ where: { id } })

    revalidatePath("/super-admin/testimonials")
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error deleting testimonial:", error)
    const message = error instanceof Error ? error.message : "Failed to delete"
    if (message.includes("prisma")) {
      return NextResponse.json({ error: "Database error. Please check your data and try again." }, { status: 500 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}