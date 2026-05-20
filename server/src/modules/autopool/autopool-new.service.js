import mongoose from "mongoose";
import { AutoPoolEntry } from "./autopool-entry.model.js";
import { AutoPoolQueue } from "./autopool-queue.model.js";
import { AutoPoolCounter } from "./autopool-counter.model.js";
import { RebirthId } from "./rebirth.model.js";
import { AutoPoolLog } from "./autopool-log.model.js";
import { User } from "../user/user.model.js";
import { isAutopoolRepairLocked } from "./autopool-repair-lock.service.js";

let isQueueProcessing = false;

const QUEUE_COUNTER_KEY = "autopool_queue";

const getNextQueuePosition = async (session) => {
  const counter = await AutoPoolCounter.findOneAndUpdate(
    { key: QUEUE_COUNTER_KEY },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session },
  );
  return counter.seq;
};

const normalizeRebirthCode = (code) => code.trim();

export const autoPoolNewService = {
  // ──────────────────────────────────────────────────────────────────────────
  // Deposit Integration
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Initialize AutoPool after a successful deposit.
   * NOTE: Main user never enters the pool. Only 2 rebirth nodes are created.
   */
  createInitialAutoPoolEntriesAfterDeposit: async (
    userId,
    depositId,
    session = null,
  ) => {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    const existingRebirth = await AutoPoolEntry.findOne({
      ownerUserId: userId,
      "metadata.depositId": depositId.toString(),
      sourceType: "REBIRTH",
    }).session(session);

    if (existingRebirth) {
      console.log(`[AutoPool] Rebirths already exist for deposit ${depositId}`);
      return { skipped: true };
    }

    const rebirthEntries = [];

    for (let i = 1; i <= 2; i++) {
      const rebirthCode = normalizeRebirthCode(
        `${user.memberId}-RB0-${i}-${depositId.toString().slice(-6)}`,
      );

      const rebirthEntry = await autoPoolNewService.createRebirthNode(
        {
          ownerUserId: user._id,
          sourceUserId: user._id,
          rebirthCode,
          rebirthLevel: 0,
          createdFromEntryId: null,
          rebirthIndex: i,
          metadata: { depositId: depositId.toString() },
        },
        session,
      );

      await autoPoolNewService.enqueueNode(rebirthEntry._id, session, {
        queueTimestamp: rebirthEntry.queueTimestamp,
      });
      rebirthEntries.push(rebirthEntry);
    }

    await autoPoolNewService.logAction(
      "INITIAL_REBIRTHS",
      null,
      userId,
      `Created 2 rebirth nodes for deposit ${depositId}`,
      null,
      { rebirthEntryIds: rebirthEntries.map((e) => e._id) },
      session,
    );

    if (!session) {
      setImmediate(() => autoPoolNewService.processAutoPoolQueue());
    }

    return { rebirthEntries };
  },

  createInitialRebirths: async (userId, depositId, session = null) => {
    return autoPoolNewService.createInitialAutoPoolEntriesAfterDeposit(
      userId,
      depositId,
      session,
    );
  },

  initializeAutoPool: async (userId, depositId, session = null) => {
    return autoPoolNewService.createInitialAutoPoolEntriesAfterDeposit(
      userId,
      depositId,
      session,
    );
  },

  processDepositSuccess: async (userId, depositId, session = null) => {
    const result =
      await autoPoolNewService.createInitialAutoPoolEntriesAfterDeposit(
        userId,
        depositId,
        session,
      );

    if (!session) {
      setImmediate(() => autoPoolNewService.processAutoPoolQueue());
    }

    return result;
  },

  activateUser: async (userId, session = null) => {
    const update = {
      isActivated: true,
      isActive: true,
      status: "active",
      activationStatus: "ACTIVE",
      activatedAt: new Date(),
    };

    const opts = { new: true };
    if (session) opts.session = session;

    return User.findByIdAndUpdate(userId, update, opts);
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Queue Service
  // ──────────────────────────────────────────────────────────────────────────

  enqueueNode: async (nodeId, session = null, options = {}) => {
    const existingQueue = await AutoPoolQueue.findOne({ nodeId }).session(
      session,
    );

    if (existingQueue) return existingQueue;

    const queuePosition = await getNextQueuePosition(session);
    const now = new Date();

    const entry = await AutoPoolEntry.findById(nodeId).session(session);
    if (!entry) throw new Error("AutoPool node not found for enqueue");

    const queueTimestamp =
      options.queueTimestamp || entry.queueTimestamp || now;
    entry.queuePosition = queuePosition;
    entry.queueTimestamp = queueTimestamp;
    await entry.save({ session });

    return AutoPoolQueue.findOneAndUpdate(
      { nodeId },
      {
        $setOnInsert: {
          nodeId,
          queuePosition,
          queueTimestamp,
          status: "WAITING",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, session },
    );
  },

  reserveQueueNode: async (session) => {
    const lockId = new mongoose.Types.ObjectId().toString();
    const now = new Date();
    return AutoPoolQueue.findOneAndUpdate(
      { status: "WAITING" },
      {
        $set: {
          status: "PROCESSING",
          processingLockId: lockId,
          processingStartedAt: now,
        },
      },
      { sort: { queuePosition: 1 }, new: true, session },
    );
  },

  dequeueNode: async (session = null) => {
    return autoPoolNewService.reserveQueueNode(session);
  },

  releaseQueueNode: async (queueId, session = null) => {
    return AutoPoolQueue.findByIdAndUpdate(
      queueId,
      {
        $set: {
          status: "WAITING",
          processingLockId: null,
          processingStartedAt: null,
        },
      },
      { new: true, session },
    );
  },

  backfillQueueFromPendingEntries: async (limit = 200) => {
    const pendingEntries = await AutoPoolEntry.find({
      status: "PENDING",
      sourceType: "REBIRTH",
    })
      .sort({ queueTimestamp: 1 })
      .limit(limit)
      .lean();

    if (!pendingEntries.length) {
      return { added: 0 };
    }

    const pendingIds = pendingEntries.map((entry) => entry._id);
    const queued = await AutoPoolQueue.find({ nodeId: { $in: pendingIds } })
      .select("nodeId")
      .lean();

    const queuedIds = new Set(queued.map((item) => String(item.nodeId)));
    let added = 0;

    for (const entry of pendingEntries) {
      if (queuedIds.has(String(entry._id))) continue;
      await autoPoolNewService.enqueueNode(entry._id, null, {
        queueTimestamp: entry.queueTimestamp,
      });
      added += 1;
    }

    return { added };
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Matrix Service
  // ──────────────────────────────────────────────────────────────────────────

  findAvailableParent: async (session = null) => {
    return autoPoolNewService.findNextAvailableParent(session);
  },

  validateParentCapacity: (parent) => {
    return !!parent && parent.directChildrenCount < 3;
  },

  attachChild: async (parentId, childId, session = null) => {
    return AutoPoolEntry.findOneAndUpdate(
      { _id: parentId, status: "PLACED", directChildrenCount: { $lt: 3 } },
      {
        $push: { childrenEntryIds: childId },
        $inc: { directChildrenCount: 1 },
      },
      { new: true, session },
    );
  },

  placeNode: async (entryId, parentEntryId, session = null) => {
    return autoPoolNewService.placeEntryInMatrix(
      entryId,
      parentEntryId,
      session,
    );
  },

  findNextAvailableParent: async (session = null) => {
    return AutoPoolEntry.findOne({
      status: "PLACED",
      directChildrenCount: { $lt: 3 },
    })
      .sort({ placedAt: 1, queueTimestamp: 1 })
      .session(session);
  },

  placeEntryInMatrix: async (entryId, parentEntryId, session = null) => {
    const entry = await AutoPoolEntry.findById(entryId).session(session);
    if (!entry) throw new Error("Entry not found");
    if (entry.status !== "PENDING") return entry;

    const parent = await AutoPoolEntry.findById(parentEntryId).session(session);
    if (!parent) throw new Error("Parent not found");

    if (parent.directChildrenCount >= 3) {
      throw new Error("Parent is already full");
    }

    const now = new Date();

    const updatedEntry = await AutoPoolEntry.findOneAndUpdate(
      { _id: entryId, status: "PENDING" },
      {
        $set: {
          status: "PLACED",
          matrixParentEntryId: parent._id,
          depth: (parent.depth || 0) + 1,
          placedAt: now,
        },
      },
      { new: true, session },
    );

    if (!updatedEntry) return entry;

    const updatedParent = await autoPoolNewService.attachChild(
      parent._id,
      updatedEntry._id,
      session,
    );

    if (!updatedParent) {
      throw new Error("Parent slot unavailable during placement");
    }

    await autoPoolNewService.logAction(
      "PLACE_ENTRY",
      updatedEntry._id,
      updatedEntry.ownerUserId,
      `Placed under parent ${updatedParent.displayId}`,
      null,
      { parentId: updatedParent._id },
      session,
    );

    if (updatedParent.directChildrenCount === 3) {
      await autoPoolNewService.completeNode(updatedParent._id, session);
    }

    return updatedEntry;
  },

  placeRootEntry: async (entryId, session = null) => {
    const now = new Date();
    const updatedEntry = await AutoPoolEntry.findOneAndUpdate(
      { _id: entryId, status: "PENDING" },
      {
        $set: {
          status: "PLACED",
          matrixParentEntryId: null,
          depth: 0,
          placedAt: now,
        },
      },
      { new: true, session },
    );

    if (!updatedEntry) return null;

    await autoPoolNewService.logAction(
      "PLACE_ROOT",
      updatedEntry._id,
      updatedEntry.ownerUserId,
      "Placed as root node",
      null,
      null,
      session,
    );

    return updatedEntry;
  },

  completeNode: async (parentEntryId, session = null) => {
    const parent = await AutoPoolEntry.findOneAndUpdate(
      {
        _id: parentEntryId,
        status: "PLACED",
        directChildrenCount: 3,
        completionProcessed: { $ne: true },
      },
      {
        $set: {
          status: "COMPLETED",
          completedAt: new Date(),
          completionProcessed: true,
        },
      },
      { new: true, session },
    );

    if (!parent) return null;

    const childIds = parent.childrenEntryIds || [];
    const children = await AutoPoolEntry.find({ _id: { $in: childIds } })
      .session(session)
      .lean();

    const orderedChildren = childIds
      .map((id) => children.find((child) => String(child._id) === String(id)))
      .filter(Boolean);

    const [firstChild, secondChild] = orderedChildren;

    if (firstChild) {
      await autoPoolNewService.generateChildRebirths(firstChild, session);
    }

    if (secondChild) {
      await autoPoolNewService.generateChildRebirths(secondChild, session);
    }

    await autoPoolNewService.logAction(
      "NODE_COMPLETED",
      parent._id,
      parent.ownerUserId,
      `Node ${parent.displayId} completed with 3 children`,
      null,
      { childIds },
      session,
    );

    return parent;
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Rebirth Service
  // ──────────────────────────────────────────────────────────────────────────

  generateRebirthCode: async (ownerUserId, baseRef, index, session = null) => {
    const userQuery = User.findById(ownerUserId);
    if (session) userQuery.session(session);
    const user = await userQuery.lean();
    const memberId = user?.memberId || "RB";
    const suffix = baseRef
      ? String(baseRef).slice(-6)
      : Date.now().toString(36);
    return normalizeRebirthCode(`${memberId}-RB${index}-${suffix}`);
  },

  createRebirthNode: async (payload, session = null) => {
    const {
      ownerUserId,
      sourceUserId,
      rebirthCode,
      rebirthLevel,
      createdFromEntryId,
      rebirthIndex,
      metadata,
    } = payload;

    const nodePayload = {
      ownerUserId,
      sourceUserId: sourceUserId || ownerUserId,
      displayId: rebirthCode,
      rebirthCode,
      sourceType: "REBIRTH",
      rebirthLevel: rebirthLevel || 0,
      rebirthIndex: rebirthIndex || null,
      sourceEntryId: createdFromEntryId || null,
      createdFromEntryId: createdFromEntryId || null,
      status: "PENDING",
      metadata: metadata || {},
    };

    const rebirthEntry = await AutoPoolEntry.findOneAndUpdate(
      {
        createdFromEntryId: createdFromEntryId || null,
        rebirthIndex: rebirthIndex || null,
        sourceType: "REBIRTH",
        ...(createdFromEntryId
          ? {}
          : { ownerUserId, "metadata.depositId": metadata?.depositId }),
      },
      { $setOnInsert: nodePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true, session },
    );

    const rebirthRecord = await RebirthId.findOneAndUpdate(
      { rebirthCode },
      {
        $setOnInsert: {
          ownerUserId,
          rebirthCode,
          generation: rebirthLevel || 0,
          sourceEntryId: createdFromEntryId,
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

    return rebirthEntry;
  },

  generateChildRebirths: async (childEntry, session = null) => {
    const updatedChild = await AutoPoolEntry.findOneAndUpdate(
      { _id: childEntry._id, rebirthGenerated: { $ne: true } },
      { $set: { rebirthGenerated: true } },
      { new: true, session },
    );

    if (!updatedChild) {
      return { skipped: true };
    }

    const rebirthLevel = (updatedChild.rebirthLevel || 0) + 1;
    const rebirthEntries = [];

    for (let i = 1; i <= 2; i++) {
      const rebirthCode = await autoPoolNewService.generateRebirthCode(
        updatedChild.ownerUserId,
        updatedChild._id,
        i,
        session,
      );

      const rebirthEntry = await autoPoolNewService.createRebirthNode(
        {
          ownerUserId: updatedChild.ownerUserId,
          sourceUserId: updatedChild.ownerUserId,
          rebirthCode,
          rebirthLevel,
          createdFromEntryId: updatedChild._id,
          rebirthIndex: i,
          metadata: {
            fromEntryId: updatedChild._id.toString(),
          },
        },
        session,
      );

      await autoPoolNewService.enqueueNode(rebirthEntry._id, session, {
        queueTimestamp: rebirthEntry.queueTimestamp,
      });
      rebirthEntries.push(rebirthEntry);
    }

    await autoPoolNewService.logAction(
      "REBIRTH_CREATED",
      updatedChild._id,
      updatedChild.ownerUserId,
      `Created 2 rebirths for child ${updatedChild.displayId}`,
      null,
      { rebirthEntryIds: rebirthEntries.map((e) => e._id) },
      session,
    );

    return { rebirthEntries };
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Queue Processing
  // ──────────────────────────────────────────────────────────────────────────

  processAutoPoolQueue: async () => {
    if (await isAutopoolRepairLocked()) {
      return { processedCount: 0, skipped: true, repairLocked: true };
    }

    if (isQueueProcessing) {
      return { processedCount: 0, skipped: true };
    }

    isQueueProcessing = true;

    let processedCount = 0;
    const MAX_PROCESS = 75;

    try {
      await autoPoolNewService.backfillQueueFromPendingEntries();

      while (processedCount < MAX_PROCESS) {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();

          const queueItem = await autoPoolNewService.reserveQueueNode(session);
          if (!queueItem) {
            await session.commitTransaction();
            break;
          }

          const entry = await AutoPoolEntry.findById(queueItem.nodeId).session(
            session,
          );

          if (!entry || entry.status !== "PENDING") {
            await AutoPoolQueue.findByIdAndUpdate(
              queueItem._id,
              { $set: { status: "PLACED" } },
              { session },
            );
            await session.commitTransaction();
            processedCount++;
            continue;
          }

          const parent =
            await autoPoolNewService.findNextAvailableParent(session);

          if (!parent) {
            const existingPlaced = await AutoPoolEntry.countDocuments({
              status: { $in: ["PLACED", "COMPLETED"] },
            }).session(session);

            if (existingPlaced > 0) {
              throw new Error("No available parent for placement");
            }

            const placedRoot = await autoPoolNewService.placeRootEntry(
              entry._id,
              session,
            );

            if (!placedRoot) {
              throw new Error("Failed to place root entry");
            }
          } else {
            await autoPoolNewService.placeEntryInMatrix(
              entry._id,
              parent._id,
              session,
            );
          }

          await AutoPoolQueue.findByIdAndUpdate(
            queueItem._id,
            { $set: { status: "PLACED" } },
            { session },
          );

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

  // ──────────────────────────────────────────────────────────────────────────
  // Logging
  // ──────────────────────────────────────────────────────────────────────────

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
