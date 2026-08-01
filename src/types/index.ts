export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  codes?: string[];
  data?: T;
  redirectTo?: string;
};

export * from "./subscription";
export * from "./audit";
export * from "./branch";