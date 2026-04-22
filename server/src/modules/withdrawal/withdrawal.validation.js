import { z } from "zod";

export const createWithdrawalSchema = z.object({
  amount: z.coerce.number().positive(),
  walletAddress: z.string().trim().min(6),
  twoFactorCode: z.string().trim().min(4).optional(),
});

export const rejectWithdrawalSchema = z.object({
  reason: z.string().trim().min(3),
});
