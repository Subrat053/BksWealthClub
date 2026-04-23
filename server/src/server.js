import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { logger } from "./common/logger/logger.js";
import { registerAutopoolJob } from "./jobs/autopool.job.js";
import { registerIncomeJob } from "./jobs/income.job.js";
import { registerNotificationJob } from "./jobs/notification.job.js";
import { seedSuperAdmin } from "./modules/admin/seedSuperAdmin.js";

async function bootstrap() {
  await connectDatabase();
  await seedSuperAdmin();

  registerAutopoolJob();
  registerIncomeJob();
  registerNotificationJob();

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  logger.error("Failed to bootstrap server", error);
  process.exit(1);
});
