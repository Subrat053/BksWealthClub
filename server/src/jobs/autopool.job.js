/**
 * DEPRECATED: Old AutoPool Job
 * This is kept for reference but disabled.
 * Use registerAutopool3x3Job() instead for the new 3x3 Matrix AutoPool.
 */
export function registerAutopoolJob() {
  if (globalThis.__autopoolQueueJobRegistered) return;
  globalThis.__autopoolQueueJobRegistered = true;
  
  // Old autopool job is disabled - use new 3x3 system instead
  console.log("[AutoPool] Old autopool job disabled. Using new 3x3 system.");
  return;
}

/**
 * DEPRECATED: Old AutoPool Queue Processing
 * Kept for backward compatibility but not used.
 * Do NOT call this - it uses outdated schema.
 */
// export const oldProcessAutopoolQueue = async () => {
//   try {
//     const { autopoolService } = await import(
//       "../modules/autopool/autopool.service.js",
//     );
//     await autopoolService.processAutopoolQueue();
//   } catch (error) {
//     console.error("[AutoPool] Scheduled queue processing failed:", error);
//   }
// };

/**
 * 3x3 AutoPool Queue Processing Job
 * Processes pending nodes and places them in the matrix every 10 seconds
 */
export function registerAutopool3x3Job() {
  if (globalThis.__autopool3x3QueueJobRegistered) return;
  globalThis.__autopool3x3QueueJobRegistered = true;

  const runQueue = async () => {
    try {
      const autopool3x3Service = (await import(
        "../modules/autopool/autopool-3x3.service.js",
      )).default;
      
      const result = await autopool3x3Service.processAutoPoolQueue();
      
      if (result.placedCount > 0) {
        console.log(
          `[AutoPool 3x3] Queue processing: placed ${result.placedCount} nodes`,
        );
      }
    } catch (error) {
      console.error("[AutoPool 3x3] Scheduled queue processing failed:", error);
    }
  };

  // Run immediately on startup
  void runQueue();
  
  // Run every 10 seconds
  setInterval(runQueue, 10000);
}

