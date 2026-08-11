"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { unlink } from "fs/promises"
import path from "path"
import { v2 as cloudinary } from "cloudinary"
import type { ActionResult } from "@/types"

// ── Cloudinary Config ───────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ── Constants ────────────────────────────────────────

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB (STL files can be large)

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/sla",
  "application/vnd.ms-pki.stl",
  "model/stl",
]

const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "stl"]

// ── Helpers ─────────────────────────────────────────

function getResourceType(fileName: string): "image" | "raw" {
  const ext = fileName.split(".").pop()?.toLowerCase() || ""
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"]
  return imageExts.includes(ext) ? "image" : "raw"
}

function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || ""
}

function resolveMimeType(file: File): string {
  if (file.type && file.type !== "" && file.type !== "application/octet-stream") {
    return file.type
  }
  const ext = getFileExtension(file.name)
  const mimeMap: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    stl: "application/sla",
  }
  return mimeMap[ext] || ""
}

// ── Zod Schema ───────────────────────────────────────

const AttachmentSchema = z.object({
  patientId: z.string().min(1),
  category: z.enum([
    "LAB_RESULT",
    "XRAY",
    "MRI",
    "CT_SCAN",
    "THREE_D_MODEL",
    "PRESCRIPTION",
    "MEDICAL_REPORT",
    "OTHER",
  ]),
})

// ── Upload Attachment ────────────────────────────────

export async function uploadAttachment(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) {
    return { success: false, error: "Forbidden" }
  }

  const file = formData.get("file") as File | null
  const patientId = formData.get("patientId") as string
  const category = formData.get("category") as string

  if (!file || file.size === 0) {
    return { success: false, error: "No file selected" }
  }

  // Validate file extension
  const ext = getFileExtension(file.name)
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { success: false, error: `Unsupported file type (.${ext}). Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` }
  }

  // Validate MIME type (with fallback for when browser doesn't set it)
  const mimeType = resolveMimeType(file)
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { success: false, error: "File type not allowed. Supported: PDF, JPG, PNG, STL" }
  }

  // Validate other fields
  const parsed = AttachmentSchema.safeParse({ patientId, category })
  if (!parsed.success) {
    return { success: false, error: "Invalid form data" }
  }

  // Verify patient belongs to clinic
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId: session.user.clinicId },
  })
  if (!patient) return { success: false, error: "Patient not found" }

  try {
    // Upload to Cloudinary
    const resourceType = getResourceType(file.name)
    const buffer = Buffer.from(await file.arrayBuffer())
    const clinicFolder = `medical_files/${session.user.clinicId}`

    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: resourceType,
            folder: clinicFolder,
            public_id: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        .end(buffer)
    })

    // Save record to database
    await prisma.attachment.create({
      data: {
        patientId: parsed.data.patientId,
        uploadedById: session.user.id,
        fileName: file.name,
        fileUrl: uploadResult.secure_url,
        fileType: mimeType || file.type || "application/octet-stream",
        category: parsed.data.category,
        fileSize: file.size,
      },
    })

    revalidatePath(`/patients/${patientId}/attachments`)
    revalidatePath(`/patients/${patientId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Upload error:", error?.message || error)
    const msg = error?.message || ""
    if (msg.includes("cloud_name")) {
      return { success: false, error: "Storage not configured. Contact support." }
    }
    if (msg.includes("invalid api_key")) {
      return { success: false, error: "Storage authentication failed. Contact support." }
    }
    return { success: false, error: "Failed to upload file" }
  }
}

// ── Delete Attachment ────────────────────────────────

export async function deleteAttachment(attachmentId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR"].includes(session.user.role)) {
    return { success: false, error: "Forbidden" }
  }

  try {
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId },
      include: { patient: { select: { id: true, clinicId: true } } },
    })
    if (!attachment) return { success: false, error: "Attachment not found" }
    if (attachment.patient.clinicId !== session.user.clinicId) {
      return { success: false, error: "Unauthorized" }
    }

    // Attempt to delete from local disk (for legacy files uploaded before Cloudinary migration)
    if (attachment.fileUrl.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", attachment.fileUrl)
      try {
        await unlink(filePath)
      } catch {
        // File might not exist on disk (already deleted or never was local)
      }
    }
    // Note: Cloudinary files are not deleted here because we don't store the public_id.
    // They can be cleaned up from the Cloudinary dashboard if needed.

    // Delete from database
    await prisma.attachment.delete({ where: { id: attachmentId } })

    revalidatePath(`/patients/${attachment.patientId}/attachments`)
    revalidatePath(`/patients/${attachment.patientId}`)
    return { success: true }
  } catch (error) {
    console.error("Delete error:", error)
    return { success: false, error: "Failed to delete attachment" }
  }
}

// ── Get Attachments by Patient ───────────────────────

export async function getAttachmentsByPatientId(patientId: string, clinicId: string) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    select: { id: true },
  })
  if (!patient) return []

  return prisma.attachment.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { id: true, name: true } },
    },
  })
}