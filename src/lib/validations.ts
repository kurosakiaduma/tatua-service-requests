import { z } from "zod";

export const categories = [
  "streetlight",
  "water",
  "garbage",
  "roads",
  "sewage",
  "other",
] as const;

export const statuses = ["pending", "in_progress", "resolved"] as const;

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const requestSchema = z.object({
  category: z.enum(categories),
  location: z.string().trim().min(3).max(240),
  description: z.string().trim().min(10).max(2000),
});

export const statusUpdateSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(statuses),
});

export type RequestInput = z.infer<typeof requestSchema>;
export type Status = z.infer<typeof statusUpdateSchema>["status"];
