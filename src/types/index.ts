// src/types/index.ts
export type ActionResult = {
  success: boolean;
  error?: string;
  message?: string; // ← أضف السطر ده
  fieldErrors?: Record<string, string[]>;
};
export * from "./subscription";
export * from "./audit";
export * from "./branch";