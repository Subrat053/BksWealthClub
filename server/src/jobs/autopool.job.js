export function registerAutopoolJob() {
  if (globalThis.__autopoolQueueJobRegistered) return;
  globalThis.__autopoolQueueJobRegistered = true;

  const runQueue = async () => {
    try {
      const { autopoolService } = await import(
        "../modules/autopool/autopool.service.js",
      );
      await autopoolService.processAutopoolQueue();
    } catch (error) {
      console.error("[AutoPool] Scheduled queue processing failed:", error);
    }
  };

  void runQueue();
  setInterval(runQueue, 15000);
}
