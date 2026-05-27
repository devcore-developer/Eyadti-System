// src/types/index.ts
export type ActionResult = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}
export * from "./subscription";
export * from "./audit";
export * from "./branch";