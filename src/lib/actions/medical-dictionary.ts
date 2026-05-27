"use server"

import { prisma } from "@/lib/db"

// ── Search Complaints ────────────────────────────────

export async function searchComplaints(query: string) {
  if (!query || query.trim().length < 2) return []

  return prisma.complaintMaster.findMany({
    where: {
      name: {
        contains: query.trim(),
        mode: "insensitive",
      },
    },
    take: 10,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      specialty: true,
    },
  })
}

// ── Search Diagnoses ─────────────────────────────────

export async function searchDiagnoses(query: string) {
  if (!query || query.trim().length < 2) return []

  return prisma.diagnosisMaster.findMany({
    where: {
      name: {
        contains: query.trim(),
        mode: "insensitive",
      },
    },
    take: 10,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      specialty: true,
    },
  })
}

// ── Search Treatment Templates ───────────────────────

export async function searchTreatmentTemplates(query: string) {
  if (!query || query.trim().length < 2) return []

  return prisma.treatmentTemplate.findMany({
    where: {
      title: {
        contains: query.trim(),
        mode: "insensitive",
      },
    },
    take: 10,
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      content: true,
      specialty: true,
    },
  })
}

// ── Search Egyptian Drugs ────────────────────────────

export async function searchDrugs(query: string) {
  if (!query || query.trim().length < 2) return []

  const [byName, byGeneric] = await Promise.all([
    prisma.drugMaster.findMany({
      where: { name: { contains: query.trim(), mode: "insensitive" } },
      take: 8,
      orderBy: { name: "asc" },
      select: { id: true, name: true, genericName: true, category: true, form: true, dosage: true, notes: true },
    }),
    prisma.drugMaster.findMany({
      where: { genericName: { contains: query.trim(), mode: "insensitive" } },
      take: 8,
      orderBy: { name: "asc" },
      select: { id: true, name: true, genericName: true, category: true, form: true, dosage: true, notes: true },
    }),
  ])

  // دمج النتائج وإزالة التكرار
  const seen = new Set<string>()
  const combined = [...byName, ...byGeneric].filter((d) => {
    if (seen.has(d.id)) return false
    seen.add(d.id)
    return true
  })

  return combined.slice(0, 10)
}

// ── Get All (for dropdown lists if needed) ───────────

export async function getAllComplaints() {
  return prisma.complaintMaster.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, specialty: true },
  })
}

export async function getAllDiagnoses() {
  return prisma.diagnosisMaster.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, specialty: true },
  })
}