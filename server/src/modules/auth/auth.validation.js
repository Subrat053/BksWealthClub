import { z } from "zod";

export const validateRegisterInput = (body) => {
  const errors = [];
  const sponsorIdPattern = /^(BKS|BWC)\d{5,}$/i;
  const referralCodePattern = /^[A-Z]{1,4}\d{6}$/i;

  if (!body.fullName?.trim()) errors.push("Full name is required.");
  if (!body.email?.trim()) errors.push("Email is required.");
  if (!body.password?.trim()) errors.push("Password is required.");
  if (!body.sponsorId?.trim()) errors.push("Sponsor ID is required.");
  if (!body.registrationSource?.trim())
    errors.push("Registration source is required.");

  if (
    body.sponsorId &&
    !sponsorIdPattern.test(body.sponsorId.trim()) &&
    !referralCodePattern.test(body.sponsorId.trim())
  ) {
    errors.push("Sponsor ID or referral code must look like BKS12345 or ABCD123456.");
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
    .min(1, "Sponsor ID is required")
    .regex(
      /^(?:BKS|BWC)\d{5,}$|^[A-Z]{1,4}\d{6}$/i,
      "Sponsor ID or referral code must look like BKS12345 or ABCD123456",
    ),
});
