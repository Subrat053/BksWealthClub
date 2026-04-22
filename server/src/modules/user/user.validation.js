import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).optional(),
  country: z.string().trim().min(2).optional(),
  mobile: z.string().trim().min(5).optional(),
  walletAddresses: z.array(z.object({
    network: z.string().trim().min(2),
    address: z.string().trim().min(3),
    isPrimary: z.boolean().optional(),
  })).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});
