export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  codes?: string[];
  data?: T;
  redirectTo?: string;

  patientId?: string;
  appointmentId?: string;
  visitId?: string;
  visitCreated?: boolean;
  requiresPayment?: boolean;
  paymentPolicy?: string;
  paymentRequired?: boolean;
  paymentStatus?: {
    hasInvoice: boolean;
    invoiceId?: string; // ← مضاف
    status: string;
    totalAmount: number;
    totalPaid: number;
    remaining: number;
    paymentCount: number;
  } | null;
};

export type PaymentWorkflowType = "PAY_BEFORE_VISIT" | "PAY_AFTER_VISIT" | "SPLIT_PAYMENT";

export * from "./subscription";
export * from "./audit";
export * from "./branch";