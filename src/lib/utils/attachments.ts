// src/lib/utils/attachments.ts

export const CATEGORY_LABELS: Record<string, string> = {
  LAB_RESULT: "Lab Result",
  XRAY: "X-Ray",
  MRI: "MRI",
  CT_SCAN: "CT Scan",
  PRESCRIPTION: "Prescription",
  MEDICAL_REPORT: "Medical Report",
  OTHER: "Other",
}

export function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] || cat
}