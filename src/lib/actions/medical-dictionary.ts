"use server"

import { prisma } from "@/lib/db"

// ── Search Complaints ────────────────────────────────

export async function searchComplaints(query: string) {
  if (!query || query.trim().length < 2) return []
  const q = query.trim()

  // 1. الأولوية للكلمات التي تبدأ بالبحث
  const startsWith = await prisma.complaint.findMany({
    where: { name: { startsWith: q, mode: "insensitive" } },
    take: 20, // ← تم التعديل
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  if (startsWith.length >= 20) return startsWith // ← تم التعديل

  // 2. إكمال النتائج بالكلمات التي تحتوي على البحث
  const contains = await prisma.complaint.findMany({
    where: { 
      name: { contains: q, mode: "insensitive" },
      id: { notIn: startsWith.map(r => r.id) } 
    },
    take: 20 - startsWith.length, // ← تم التعديل
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return [...startsWith, ...contains]
}

// ── Search Diagnoses ─────────────────────────────────

export async function searchDiagnoses(query: string) {
  if (!query || query.trim().length < 2) return []
  const q = query.trim()

  // 1. الأولوية للتشخيصات التي تبدأ بالبحث
  const startsWith = await prisma.diagnosis.findMany({
    where: { name: { startsWith: q, mode: "insensitive" } },
    take: 20, // ← تم التعديل
    orderBy: { name: "asc" },
    select: { id: true, name: true, icd10Code: true },
  })

  if (startsWith.length >= 20) return startsWith // ← تم التعديل

  // 2. إكمال النتائج بالتشخيصات التي تحتوي على البحث
  const contains = await prisma.diagnosis.findMany({
    where: { 
      name: { contains: q, mode: "insensitive" },
      id: { notIn: startsWith.map(r => r.id) } 
    },
    take: 20 - startsWith.length, // ← تم التعديل
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
    take: 20, // ← تم التعديل
    orderBy: { title: "asc" },
    select: { id: true, title: true, content: true, specialty: true },
  })

  if (startsWith.length >= 20) return startsWith // ← تم التعديل

  const contains = await prisma.treatmentTemplate.findMany({
    where: { 
      title: { contains: q, mode: "insensitive" },
      id: { notIn: startsWith.map(r => r.id) } 
    },
    take: 20 - startsWith.length, // ← تم التعديل
    orderBy: { title: "asc" },
    select: { id: true, title: true, content: true, specialty: true },
  })

  return [...startsWith, ...contains]
}

// ── Search Egyptian Medications ──────────────────────

export async function searchDrugs(query: string) {
  if (!query || query.trim().length < 2) return []
  const q = query.trim()

  // 1. الأولوية للأدوية التي يبدأ اسمها التجاري أو العلمي بالبحث
  const startsWithResults = await prisma.medication.findMany({
    where: {
      OR: [
        { tradeName: { startsWith: q, mode: "insensitive" } },
        { genericName: { startsWith: q, mode: "insensitive" } },
      ],
    },
    take: 20, // ← تم التعديل
    orderBy: { tradeName: "asc" },
    select: { id: true, tradeName: true, genericName: true, strength: true, dosageForm: true },
  })

  if (startsWithResults.length >= 20) return startsWithResults // ← تم التعديل

  // 2. إكمال النتائج بالأدوية التي تحتوي على البحث
  const containsResults = await prisma.medication.findMany({
    where: {
      OR: [
        { tradeName: { contains: q, mode: "insensitive" } },
        { genericName: { contains: q, mode: "insensitive" } },
      ],
      id: { notIn: startsWithResults.map(r => r.id) },
    },
    take: 20 - startsWithResults.length, // ← تم التعديل
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