import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  platform: z.enum(["web", "mobile", "both"]),
  privacy: z.enum(["0", "1", "2"]), // 0=public, 1=private, 2=password
  password: z.string().max(255).optional(),
  excludeBots: z.boolean(),
  sessionTimeout: z.number().min(1).max(60), // minutes
  engagementThreshold: z.number().min(1).max(300), // seconds
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  privacy: z.enum(["0", "1", "2"]).optional(),
  password: z.string().max(255).optional(),
  excludeBots: z.boolean().optional(),
  sessionTimeout: z.number().min(1).max(60).optional(),
  engagementThreshold: z.number().min(1).max(300).optional(),
  favorite: z.boolean().optional(),
});

// Safe domain regex pattern (avoiding ReDOS vulnerabilities)
const DOMAIN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

export const addDomainSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required")
    .max(255)
    .regex(DOMAIN_PATTERN, "Invalid domain"),
  type: z.enum(["primary", "secondary"]),
});

export const validateProjectPasswordSchema = z.object({
  projectId: z.number(),
  password: z.string().min(1, "Password required"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddDomainInput = z.infer<typeof addDomainSchema>;
export type ValidateProjectPasswordInput = z.infer<
  typeof validateProjectPasswordSchema
>;
