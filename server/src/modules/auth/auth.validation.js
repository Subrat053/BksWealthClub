import { z } from "zod";

export const registerSchema = z.object({
  sponsorId: z.string().trim().min(3),
  name: z.string().trim().min(2),
  email: z.string().email(),
  country: z.string().trim().min(2),
  mobile: z.string().trim().min(5),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords do not match", path: ["confirmPassword"] });
  }
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(6),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const sponsorValidateSchema = z.object({
  sponsorId: z.string().trim().min(3),
});
