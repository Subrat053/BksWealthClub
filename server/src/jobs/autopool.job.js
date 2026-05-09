export function registerAutopoolJob() {
  if (globalThis.__autopoolQueueJobRegistered) return;
  globalThis.__autopoolQueueJobRegistered = true;

  const runQueue = async () => {
    try {
      const { autoPoolNewService } = await import("../modules/autopool/autopool-new.service.js");
      await autoPoolNewService.processAutoPoolQueue();
    } catch (error) {
      console.error("[AutoPool] Scheduled queue processing failed:", error);
    }
  };

  void runQueue();
  setInterval(runQueue, 15000);
}
