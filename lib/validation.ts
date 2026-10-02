import { z } from "zod";
import { spheres } from "./domain";

export const email = z.string().trim().toLowerCase().email().max(254);
export const password = z.string().min(12).max(128);
export const timezone = z.string().max(80).refine(value => {
  try { new Intl.DateTimeFormat("en", { timeZone: value }).format(); return true; } catch { return false; }
}, "Некорректный часовой пояс");
export const signupSchema = z.object({ name: z.string().trim().min(2).max(80), email, password, timezone, consent: z.literal(true), organizerCode: z.string().max(128).optional() }).strict();
export const loginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
export const profileSchema = z.object({ name: z.string().trim().min(2).max(80), timezone, focus: z.enum(spheres), goal: z.string().trim().max(500), answers: z.array(z.string().max(1500)).length(3), scores: z.array(z.number().int().min(0).max(10).nullable()).length(12), paused: z.boolean() }).strict();
export const reportSchema = z.object({ result: z.enum(["COMPLETED", "PARTIAL", "SKIPPED"]), variant: z.enum(["minimum", "normal", "expanded"]), note: z.string().max(1500).optional().transform(value => value ?? "") }).strict();
