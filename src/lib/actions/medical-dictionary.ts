"use server"

import { prisma } from "@/lib/db"

// ── Search Complaints ────────────────────────────────

export async function searchComplaints(query: string) {
  if (!query || query.trim().length < 2) return []
  const q = query.trim()

  const startsWith = await prisma.complaint.findMany({
    where: { name: { startsWith: q, mode: "insensitive" } },
    take: 20,
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  if (startsWith.length >= 20) return startsWith

  const contains = await prisma.complaint.findMany({
    where: { 
      name: { contains: q, mode: "insensitive" },
      id: { notIn: startsWith.map(r => r.id) } 
    },
    take: 20 - startsWith.length,
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return [...startsWith, ...contains]
}

// ── Search Diagnoses ─────────────────────────────────

export async function searchDiagnoses(query: string) {
  if (!query || query.trim().length < 2) return []
  const q = query.trim()

  const startsWith = await prisma.diagnosis.findMany({
    where: { name: { startsWith: q, mode: "insensitive" } },
    take: 20,
    orderBy: { name: "asc" },
    select: { id: true, name: true, icd10Code: true },
  })

  if (startsWith.length >= 20) return startsWith

  const contains = await prisma.diagnosis.findMany({
    where: { 
      name: { contains: q, mode: "insensitive" },
      id: { notIn: startsWith.map(r => r.id) } 
    },
    take: 20 - startsWith.length,
    orderBy: { name: "asc" },
    select: { id: true, name: true, icd10Code: true },
  })

  return [...startsWith, ...contains]
}

// ── Search Treatment Templates ───────────────────────

export async function searchTreatmentTemplates(query: string) {
  if (!query || query.trim().length < 2) return []
  const q = query.trim()

  const startsWith = await prisma.treatmentTemplate.findMany({
    where: { title: { startsWith: q, mode: "insensitive" } },
    take: 20,
    orderBy: { title: "asc" },
    select: { id: true, title: true, content: true, specialty: true },
  })

  if (startsWith.length >= 20) return startsWith

  const contains = await prisma.treatmentTemplate.findMany({
    where: { 
      title: { contains: q, mode: "insensitive" },
      id: { notIn: startsWith.map(r => r.id) } 
    },
    take: 20 - startsWith.length,
    orderBy: { title: "asc" },
    select: { id: true, title: true, content: true, specialty: true },
  })

  return [...startsWith, ...contains]
}

// ── Search Egyptian Medications ──────────────────────

export async function searchDrugs(query: string) {
  if (!query || query.trim().length < 2) return []
  const q = query.trim()

  const startsWithResults = await prisma.medication.findMany({
    where: {
      OR: [
        { tradeName: { startsWith: q, mode: "insensitive" } },
        { genericName: { startsWith: q, mode: "insensitive" } },
      ],
    },
    take: 20,
    orderBy: { tradeName: "asc" },
    select: { id: true, tradeName: true, genericName: true, strength: true, dosageForm: true },
  })

  if (startsWithResults.length >= 20) return startsWithResults

  const containsResults = await prisma.medication.findMany({
    where: {
      OR: [
        { tradeName: { contains: q, mode: "insensitive" } },
        { genericName: { contains: q, mode: "insensitive" } },
      ],
      id: { notIn: startsWithResults.map(r => r.id) },
    },
    take: 20 - startsWithResults.length,
    orderBy: { tradeName: "asc" },
    select: { id: true, tradeName: true, genericName: true, strength: true, dosageForm: true },
  })

  return [...startsWithResults, ...containsResults]
}

// ── Get All (for dropdown lists if needed) ───────────

export async function getAllComplaints() {
  return prisma.complaint.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
}

export async function getAllDiagnoses() {
  return prisma.diagnosis.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, icd10Code: true },
  })
}

// ── Search Allergies ──────────────────────────────────

export async function searchAllergies(query: string) {
  if (!query || query.trim().length < 2) return []
  const q = query.trim()

  const startsWith = await prisma.allergyDict.findMany({
    where: { name: { startsWith: q, mode: "insensitive" } },
    take: 20,
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  })

  let results = startsWith

  if (startsWith.length < 20) {
    const contains = await prisma.allergyDict.findMany({
      where: { 
        name: { contains: q, mode: "insensitive" },
        id: { notIn: startsWith.map((r: { id: string }) => r.id) } 
      },
      take: 20 - startsWith.length,
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true },
    })
    results = [...startsWith, ...contains]
  }

  return results.map((a: { id: string; name: string; category: string | null }) => ({
    id: a.id,
    label: a.name,
    sublabel: a.category || undefined,
  }))
}

// ── Search Surgical Procedures ────────────────────────

export async function searchSurgeries(query: string) {
  if (!query || query.trim().length < 2) return []
  const q = query.trim()

  const startsWith = await prisma.surgeryDict.findMany({
    where: { name: { startsWith: q, mode: "insensitive" } },
    take: 20,
    orderBy: { name: "asc" },
    select: { id: true, name: true, specialty: true },
  })

  let results = startsWith

  if (startsWith.length < 20) {
    const contains = await prisma.surgeryDict.findMany({
      where: { 
        name: { contains: q, mode: "insensitive" },
        id: { notIn: startsWith.map((r: { id: string }) => r.id) } 
      },
      take: 20 - startsWith.length,
      orderBy: { name: "asc" },
      select: { id: true, name: true, specialty: true },
    })
    results = [...startsWith, ...contains]
  }

  return results.map((s: { id: string; name: string; specialty: string | null }) => ({
    id: s.id,
    label: s.name,
    sublabel: s.specialty || undefined,
  }))
}

// ── Search Past Medical History ──────────────────────

export async function searchMedicalHistory(query: string) {
  if (!query || query.trim().length < 2) return []
  const q = query.trim()

  const startsWith = await prisma.medicalHistoryDict.findMany({
    where: { name: { startsWith: q, mode: "insensitive" } },
    take: 20,
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  })

  let results = startsWith

  if (startsWith.length < 20) {
    const contains = await prisma.medicalHistoryDict.findMany({
      where: { 
        name: { contains: q, mode: "insensitive" },
        id: { notIn: startsWith.map((r: { id: string }) => r.id) } 
      },
      take: 20 - startsWith.length,
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true },
    })
    results = [...startsWith, ...contains]
  }

  return results.map((item: { id: string; name: string; category: string | null }) => ({
    id: item.id,
    label: item.name,
    sublabel: item.category || undefined,
  }))
}