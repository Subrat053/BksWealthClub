import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import { userRouter } from "../modules/user/user.routes.js";
import { referralRouter } from "../modules/referral/referral.routes.js";
import { teamRouter } from "../modules/team/team.routes.js";
import { autopoolRouter } from "../modules/autopool/autopool.routes.js";
import { incomeRouter } from "../modules/income/income.routes.js";
import { depositRouter } from "../modules/deposit/deposit.routes.js";
import { activationRouter } from "../modules/activation/activation.routes.js";
import { withdrawalRouter } from "../modules/withdrawal/withdrawal.routes.js";
import { supportRouter } from "../modules/support/support.routes.js";
import { cmsRouter } from "../modules/cms/cms.routes.js";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { settingsRouter } from "../modules/settings/settings.routes.js";
// import { uploadsRouter } from "../modules/uploads/uploads.routes.js";

export const apiRouter = Router();

/*
|--------------------------------------------------------------------------
| Auth & Account
|--------------------------------------------------------------------------
*/
apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", userRouter);

/*
|--------------------------------------------------------------------------
| Member Network
|--------------------------------------------------------------------------
*/
apiRouter.use("/referrals", referralRouter);
apiRouter.use("/team", teamRouter);
apiRouter.use("/autopool", autopoolRouter);
apiRouter.use("/income", incomeRouter);

/*
|--------------------------------------------------------------------------
| Finance
|--------------------------------------------------------------------------
*/
apiRouter.use("/deposits", depositRouter);
apiRouter.use("/activations", activationRouter);
apiRouter.use("/withdrawals", withdrawalRouter);

/*
|--------------------------------------------------------------------------
| Support & CMS
|--------------------------------------------------------------------------
*/
apiRouter.use("/support", supportRouter);
apiRouter.use("/cms", cmsRouter);

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/settings", settingsRouter);

// apiRouter.use("/uploads", uploadsRouter);
