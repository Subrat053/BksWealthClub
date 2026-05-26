import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  getWalletSummaryController,
  getWalletLedgerController,
  createWithdrawRequestController,
  createWalletTransferController,
  getWithdrawHistoryController,
  getTransferHistoryController,
} from "./wallet.controller.js";

export const walletRouter = Router();

// Apply auth middleware to protect all user wallet routes
walletRouter.use(authMiddleware);

walletRouter.get("/summary", getWalletSummaryController);
walletRouter.get("/ledger", getWalletLedgerController);
walletRouter.post("/withdraw-request", createWithdrawRequestController);
walletRouter.post("/transfer", createWalletTransferController);
walletRouter.get("/withdraw-history", getWithdrawHistoryController);
walletRouter.get("/transfer-history", getTransferHistoryController);
