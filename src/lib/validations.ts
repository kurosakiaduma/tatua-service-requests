import { z } from "zod";

export const categories = [
  "streetlight",
  "water",
  "garbage",
  "roads",
  "sewage",
  "other",
] as const;

export const statuses = ["pending", "in_progress", "resolved", "rejected"] as const;

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
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const statusUpdateSchema = z.object({
  requestId: z.string().uuid(),
  status: z.preprocess((value) => value === "" ? null : value, z.enum(statuses).nullable().optional()),
  note: z.string().trim().max(2000).optional(),
});

export type RequestInput = z.infer<typeof requestSchema>;
export type Status = (typeof statuses)[number];
