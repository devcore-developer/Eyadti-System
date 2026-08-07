export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  codes?: string[];
  data?: T;
  redirectTo?: string;
};

// ⬇️⬇️⬇️ أضفنا النوع الجديد ⬇️⬇⬇️
export type PaymentWorkflowType = "PAY_BEFORE_VISIT" | "PAY_AFTER_VISIT" | "SPLIT_PAYMENT";

export * from "./subscription";
export * from "./audit";
export * from "./branch";