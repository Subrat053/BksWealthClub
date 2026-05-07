import { z } from "zod";

export const validateRegisterInput = (body) => {
  const errors = [];
  const sponsorPattern = /^[A-Z]{1,4}\d{6,}$/;

  if (!body.fullName?.trim()) errors.push("Full name is required.");
  if (!body.email?.trim()) errors.push("Email is required.");
  if (!body.password?.trim()) errors.push("Password is required.");
  if (!body.sponsorId?.trim()) errors.push("Sponsor ID or referral code is required.");
  if (!body.registrationSource?.trim())
    errors.push("Registration source is required.");

  if (body.sponsorId && !sponsorPattern.test(body.sponsorId.trim().toUpperCase())) {
    errors.push("Sponsor ID or referral code format is invalid.");
  }

  if (body.password && body.password.length < 6) {
    errors.push("Password must be at least 6 characters.");
  }

  return errors;
};

export const validateLoginInput = (body) => {
  const errors = [];
  if (!body.identifier?.trim()) errors.push("Identifier is required.");
  if (!body.password?.trim()) errors.push("Password is required.");
  return errors;
};

export const sponsorValidateSchema = z.object({
  sponsorId: z
    .string()
    .trim()
    .min(1, "Sponsor ID or referral code is required")
    .regex(/^[A-Z]{1,4}\d{6,}$/i, "Sponsor ID or referral code format is invalid"),
});
