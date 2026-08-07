// src/lib/actions/saas.ts
"use server";

// ⚠️ هذا الملف تم تفريغه لأن الدوال اللي كانت هنا
// مكررة ومتعارضة مع الملفات التالية:
//
// - src/lib/actions/plans.ts       ← إدارة الخطط
// - src/lib/actions/subscriptions.ts ← إدارة الاشتراكات
// - src/lib/actions/super-admin.ts  ← إجراءات السوبر أدمن
//
// لا تحذف الملف نفسه لأن بعض الصفحات القديمة ممكن تستورده.
// لكن الدوال الفعلية موجودة في الملفات الصحية أعلاه.

export async function placeholder() {
  return { success: true, message: "This file is deprecated. Use plans.ts or subscriptions.ts" }
}