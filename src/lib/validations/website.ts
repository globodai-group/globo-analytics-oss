import { z } from "zod";

// Safe domain regex pattern (avoiding ReDOS vulnerabilities)
const DOMAIN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

export const createWebsiteSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required")
    .max(255)
    .regex(DOMAIN_PATTERN, "Invalid domain"),
  privacy: z.enum(["0", "1", "2"]), // 0=public, 1=private, 2=password
  password: z.string().max(255).optional(),
  email: z.boolean(),
  excludeBots: z.boolean(),
  excludeIps: z.string().optional(),
  excludeParams: z.string().optional(),
});

export const updateWebsiteSchema = z.object({
  privacy: z.enum(["0", "1", "2"]).optional(),
  password: z.string().max(255).optional(),
  email: z.boolean().optional(),
  excludeBots: z.boolean().optional(),
  excludeIps: z.string().optional(),
  excludeParams: z.string().optional(),
  favorite: z.boolean().optional(),
});

export const validateWebsitePasswordSchema = z.object({
  websiteId: z.number(),
  password: z.string().min(1, "Password required"),
});

export type CreateWebsiteInput = z.infer<typeof createWebsiteSchema>;
export type UpdateWebsiteInput = z.infer<typeof updateWebsiteSchema>;
export type ValidateWebsitePasswordInput = z.infer<
  typeof validateWebsitePasswordSchema
>;
