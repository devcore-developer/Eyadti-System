import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Name must be at least 2 characters" })
      .max(100, { message: "Name must be at most 100 characters" }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(128, { message: "Password must be at most 128 characters" }),
    clinicName: z
      .string()
      .trim()
      .min(2, { message: "Clinic name must be at least 2 characters" })
      .max(200, { message: "Clinic name must be at most 200 characters" }),
    signupCode: z
      .string()
      .trim()
      .min(1, { message: "Signup code is required" }),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;