import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getIncomeHistoryController, getIncomeSummaryController } from "./income.controller.js";

export const incomeRouter = Router();

incomeRouter.use(authMiddleware);
incomeRouter.get("/summary", getIncomeSummaryController);
incomeRouter.get("/history", getIncomeHistoryController);
