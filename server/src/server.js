import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { logger } from "./common/logger/logger.js";
import { registerAutopoolJob, registerAutopool3x3Job } from "./jobs/autopool.job.js";
import { registerIncomeJob } from "./jobs/income.job.js";
import { registerNotificationJob } from "./jobs/notification.job.js";
import { seedSuperAdmin } from "./modules/admin/seedSuperAdmin.js";
import { seedOperationalAdmin } from "./modules/admin/seedOperationalAdmin.js";

async function bootstrap() {
  const databaseReady = await connectDatabase();

  if (databaseReady) {
    await seedSuperAdmin();
    await seedOperationalAdmin();
    registerAutopoolJob();
    registerAutopool3x3Job();
    registerIncomeJob();
    registerNotificationJob();
  } else {
    logger.warn("Skipping admin seeding because the database is unavailable.");
    logger.warn("Skipping scheduled jobs because the database is unavailable.");
  }

  const app = createApp();

  app.listen(env.PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  logger.error("Failed to bootstrap server", error);
  process.exit(1);
});
