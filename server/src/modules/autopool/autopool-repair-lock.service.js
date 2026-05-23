import { AutopoolRepairLock } from "./autopool-repair-lock.model.js";

export const AUTOPOOL_REPAIR_LOCK_KEY = "autopool_chronological_replay_v1";
export const AUTOPOOL_REPAIR_VERSION = "chronological-replay-v1";

export async function acquireAutopoolRepairLock({ lockedBy, mode, session = null }) {
  const now = new Date();
  
  // First ensure document exists using only the unique key in filter to prevent upsert collision.
  await AutopoolRepairLock.findOneAndUpdate(
    { key: AUTOPOOL_REPAIR_LOCK_KEY },
    { $setOnInsert: { key: AUTOPOOL_REPAIR_LOCK_KEY, isLocked: false, startedAt: null } },
    { upsert: true, new: true, session }
  );

  // Now, try to acquire it atomically if it's currently unlocked.
  const lock = await AutopoolRepairLock.findOneAndUpdate(
    {
      key: AUTOPOOL_REPAIR_LOCK_KEY,
      isLocked: false,
    },
    {
      $set: {
        isLocked: true,
        lockedBy,
        startedAt: now,
        mode,
        repairVersion: AUTOPOOL_REPAIR_VERSION,
        releasedAt: null,
      },
    },
    { new: true, session }
  );

  return lock;
}

export async function releaseAutopoolRepairLock({ lockedBy, session = null }) {
  return AutopoolRepairLock.findOneAndUpdate(
    { key: AUTOPOOL_REPAIR_LOCK_KEY, lockedBy, isLocked: true },
    {
      $set: {
        isLocked: false,
        releasedAt: new Date(),
      },
    },
    { new: true, session },
  );
}

export async function isAutopoolRepairLocked(session = null) {
  if (global.bypassAutopoolRepairLock === true) {
    return false;
  }
  const lock = await AutopoolRepairLock.findOne({
    key: AUTOPOOL_REPAIR_LOCK_KEY,
    isLocked: true,
  })
    .select("_id key isLocked mode startedAt lockedBy repairVersion")
    .session(session);

  return !!lock;
}