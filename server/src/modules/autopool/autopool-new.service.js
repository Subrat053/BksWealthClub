import mongoose from "mongoose";
import { AutoPoolEntry } from "./autopool-entry.model.js";
import { RebirthId } from "./rebirth.model.js";
import { AutoPoolLog } from "./autopool-log.model.js";
import { User } from "../user/user.model.js";

let isQueueProcessing = false;

export const autoPoolNewService = {
  /**
   * Create initial Auto Pool entries after a successful deposit.
   * 1 Main ID + 2 Rebirth IDs.
   */
  createInitialAutoPoolEntriesAfterDeposit: async (
    userId,
    depositId,
    session = null,
  ) => {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    // Check if entries already exist for this deposit to prevent duplicates
    const existingMain = await AutoPoolEntry.findOne({
      ownerUserId: userId,
      "metadata.depositId": depositId.toString(),
      sourceType: "MAIN",
    }).session(session);

    if (existingMain) {
      console.log(`[AutoPool] Entries already exist for deposit ${depositId}`);
      return;
    }

    const now = new Date();

    // 1. Create Main Pool Entry
    const mainEntry = new AutoPoolEntry({
      ownerUserId: userId,
      displayId: `${user.memberId}.1`,
      sourceType: "MAIN",
      queueTimestamp: now,
      status: "PENDING",
      metadata: { depositId: depositId.toString() },
    });
    await mainEntry.save({ session });

    // 2. Create 2 Rebirth IDs and their entries
    for (let i = 1; i <= 2; i++) {
      const rebirthCode = `${user.memberId}.R0-${i}`;

      const rebirthRecord = await RebirthId.findOneAndUpdate(
        { rebirthCode },
        {
          $setOnInsert: {
            ownerUserId: userId,
            rebirthCode,
            generation: 0,
            sourceEntryId: mainEntry._id,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, session },
      );

      const rebirthEntry = await AutoPoolEntry.findOneAndUpdate(
        { displayId: rebirthCode },
        {
          $setOnInsert: {
            ownerUserId: userId,
            displayId: rebirthCode,
            sourceType: "REBIRTH",
            rebirthLevel: 0,
            sourceEntryId: mainEntry._id,
            queueTimestamp: new Date(now.getTime() + i),
            status: "PENDING",
            metadata: {
              depositId: depositId.toString(),
              rebirthId: rebirthRecord._id.toString(),
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, session },
      );

      if (
        !rebirthRecord.autoPoolEntryId ||
        String(rebirthRecord.autoPoolEntryId) !== String(rebirthEntry._id)
      ) {
        rebirthRecord.autoPoolEntryId = rebirthEntry._id;
        await rebirthRecord.save({ session });
      }
    }

    await autoPoolNewService.logAction(
      "INITIAL_CREATION",
      null,
      userId,
      `Created Main + 2 Rebirth IDs for deposit ${depositId}`,
      null,
      { mainEntryId: mainEntry._id },
      session,
    );

    // Trigger queue processing
    // Note: We might want to trigger this AFTER the transaction commits if we're in one.
    // If session is provided, we'll let the caller decide when to process.
    if (!session) {
      setImmediate(() => autoPoolNewService.processAutoPoolQueue());
    }
  },

  /**
   * Process the pending Auto Pool queue based on FIFO.
   */
  processAutoPoolQueue: async () => {
    if (isQueueProcessing) {
      return { processedCount: 0, skipped: true };
    }

    isQueueProcessing = true;

    // We use a simplified loop. For a real production system, this might be a worker.
    let processedCount = 0;
    const MAX_PROCESS = 50; // Safety limit per run

    try {
      while (processedCount < MAX_PROCESS) {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();

          // Get the oldest pending entry
          const pendingEntry = await AutoPoolEntry.findOne({
            status: "PENDING",
          })
            .sort({ queueTimestamp: 1 })
            .session(session);

          if (!pendingEntry) {
            await session.commitTransaction();
            break; // Queue empty
          }

          // Find available parent
          const parent =
            await autoPoolNewService.findNextAvailableParent(session);

          if (parent) {
            await autoPoolNewService.placeEntryInMatrix(
              pendingEntry._id,
              parent._id,
              session,
            );
          } else {
            // If no parent found, it means this is the first entry (root)
            // or something is wrong. In a global pool, the very first entry is root.
            const totalEntries = await AutoPoolEntry.countDocuments({
              status: { $ne: "PENDING" },
            }).session(session);
            if (totalEntries === 0) {
              // This is the root node
              pendingEntry.status = "PLACED";
              pendingEntry.depth = 0;
              pendingEntry.matrixParentEntryId = null;
              await pendingEntry.save({ session });

              await autoPoolNewService.logAction(
                "PLACE_ROOT",
                pendingEntry._id,
                pendingEntry.ownerUserId,
                "Placed as root node",
                null,
                null,
                session,
              );
            } else {
              // This shouldn't happen if there are placed nodes but none available.
              // In a 3x3 matrix, there's always a parent unless we hit some limit.
              console.error(
                "[AutoPool] No available parent found for pending entry",
                pendingEntry._id,
              );
              await session.abortTransaction();
              break;
            }
          }

          await session.commitTransaction();
          processedCount++;
        } catch (error) {
          await session.abortTransaction();
          console.error("[AutoPool] Error processing queue:", error);
          break;
        } finally {
          session.endSession();
        }
      }
    } finally {
      isQueueProcessing = false;
    }

    return { processedCount, skipped: false };
  },

  /**
   * Find the oldest placed entry that has less than 3 children.
   */
  findNextAvailableParent: async (session = null) => {
    return await AutoPoolEntry.findOne({
      status: "PLACED",
      directChildrenCount: { $lt: 3 },
    })
      .sort({ queueTimestamp: 1 })
      .session(session);
  },

  /**
   * Place an entry under a parent in the matrix.
   */
  placeEntryInMatrix: async (entryId, parentEntryId, session = null) => {
    const entry = await AutoPoolEntry.findById(entryId).session(session);
    const parent = await AutoPoolEntry.findById(parentEntryId).session(session);

    if (!entry || !parent) throw new Error("Entry or Parent not found");
    if (entry.status !== "PENDING") throw new Error("Entry is not PENDING");
    if (parent.directChildrenCount >= 3)
      throw new Error("Parent is already full");

    // Update entry
    entry.status = "PLACED";
    entry.matrixParentEntryId = parent._id;
    entry.depth = parent.depth + 1;
    await entry.save({ session });

    // Update parent
    parent.childrenEntryIds.push(entry._id);
    parent.directChildrenCount = parent.childrenEntryIds.length;

    if (parent.directChildrenCount === 3) {
      parent.status = "COMPLETED";
      parent.completedAt = new Date();
    }
    await parent.save({ session });

    await autoPoolNewService.logAction(
      "PLACE_ENTRY",
      entry._id,
      entry.ownerUserId,
      `Placed under parent ${parent.displayId}`,
      null,
      { parentId: parent._id },
      session,
    );

    if (parent.status === "COMPLETED") {
      await autoPoolNewService.logAction(
        "NODE_COMPLETED",
        parent._id,
        parent.ownerUserId,
        `Node ${parent.displayId} completed with 3 children`,
        null,
        null,
        session,
      );
      await autoPoolNewService.createRebirthsAfterCompletion(
        parent._id,
        session,
      );
    }

    return entry;
  },

  /**
   * Create 2 new rebirth IDs for a completed entry's owner.
   */
  createRebirthsAfterCompletion: async (completedEntryId, session = null) => {
    const completedEntry =
      await AutoPoolEntry.findById(completedEntryId).session(session);
    if (!completedEntry) throw new Error("Completed entry not found");

    // Check if rebirths already created for this completion
    const existingRebirths = await AutoPoolEntry.findOne({
      createdFromEntryId: completedEntryId,
      sourceType: "REBIRTH",
    }).session(session);

    if (existingRebirths) {
      console.log(
        `[AutoPool] Rebirths already exist for completed entry ${completedEntryId}`,
      );
      return;
    }

    const user = await User.findById(completedEntry.ownerUserId).session(
      session,
    );
    const now = new Date();
    const nextRebirthLevel = (completedEntry.rebirthLevel || 0) + 1;

    for (let i = 1; i <= 2; i++) {
      const rebirthCode = `${user.memberId}.R${nextRebirthLevel}-${i}`;

      const rebirthRecord = await RebirthId.findOneAndUpdate(
        { rebirthCode },
        {
          $setOnInsert: {
            ownerUserId: user._id,
            rebirthCode,
            generation: nextRebirthLevel,
            sourceEntryId: completedEntry.sourceEntryId || completedEntry._id,
            parentRebirthId: completedEntry.metadata?.rebirthId || null,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, session },
      );

      const rebirthEntry = await AutoPoolEntry.findOneAndUpdate(
        { displayId: rebirthCode },
        {
          $setOnInsert: {
            ownerUserId: user._id,
            displayId: rebirthCode,
            sourceType: "REBIRTH",
            rebirthLevel: nextRebirthLevel,
            sourceEntryId: completedEntry.sourceEntryId || completedEntry._id,
            createdFromEntryId: completedEntry._id,
            queueTimestamp: new Date(now.getTime() + i),
            status: "PENDING",
            metadata: {
              rebirthId: rebirthRecord._id.toString(),
              fromCompletedEntry: completedEntryId.toString(),
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, session },
      );

      if (
        !rebirthRecord.autoPoolEntryId ||
        String(rebirthRecord.autoPoolEntryId) !== String(rebirthEntry._id)
      ) {
        rebirthRecord.autoPoolEntryId = rebirthEntry._id;
        await rebirthRecord.save({ session });
      }
    }

    await autoPoolNewService.logAction(
      "REBIRTH_CREATED",
      completedEntryId,
      completedEntry.ownerUserId,
      `Created 2 rebirths for completion of ${completedEntry.displayId}`,
      null,
      null,
      session,
    );
  },

  /**
   * Log an action in the Auto Pool system.
   */
  logAction: async (
    actionType,
    entryId,
    ownerUserId,
    message,
    beforeData,
    afterData,
    session = null,
  ) => {
    const log = new AutoPoolLog({
      actionType,
      entryId,
      ownerUserId,
      message,
      beforeData,
      afterData,
    });
    await log.save({ session });
  },
};
