import mongoose from "mongoose";
import { AutopoolMatrix } from "./autopool-matrix.model.js";
import { AutoPoolQueue } from "./autopool-queue.model.js";
import { AutoPoolCounter } from "./autopool-counter.model.js";
import { AutoPoolLock } from "./autopool-lock.model.js";
import { RebirthId } from "./rebirth.model.js";
import { User } from "../user/user.model.js";
import { isAutopoolRepairLocked } from "./autopool-repair-lock.service.js";
import {
  buildChildRebirthId,
  buildInitialRebirthIds,
  MAX_AUTOPOOL_CHILDREN,
  MAX_REBIRTH_CHILDREN,
} from "./autopool.engine.js";

const QUEUE_COUNTER_KEY = "autopool_queue_v3";
const MAX_QUEUE_RETRIES = 5;
const QUEUE_LOCK_KEY = "autopool_queue_lock_v1";
const QUEUE_LOCK_TTL_MS = 120000;
let isQueueProcessing = false;

const isTransientTransactionError = (error) => {
  if (!error) return false;
  if (error.errorLabelSet?.has("TransientTransactionError")) return true;
  if (Array.isArray(error.errorLabels)) {
    return error.errorLabels.includes("TransientTransactionError");
  }
  return error.codeName === "WriteConflict" || error.code === 112;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const acquireQueueLock = async () => {
  const now = new Date();
  const lockId = new mongoose.Types.ObjectId().toString();
  const lockedUntil = new Date(now.getTime() + QUEUE_LOCK_TTL_MS);

  let lock = await AutoPoolLock.findOneAndUpdate(
    {
      key: QUEUE_LOCK_KEY,
      $or: [{ lockedUntil: null }, { lockedUntil: { $lte: now } }],
    },
    { $set: { lockedUntil, lockedBy: lockId, lockedAt: now } },
    { new: true },
  );

  if (!lock) {
    lock = await AutoPoolLock.findOneAndUpdate(
      { key: QUEUE_LOCK_KEY },
      {
        $setOnInsert: {
          key: QUEUE_LOCK_KEY,
          lockedUntil,
          lockedBy: lockId,
          lockedAt: now,
        },
      },
      { upsert: true, new: true },
    );
  }

  if (!lock || lock.lockedBy !== lockId) return null;

  return { lockId, lockedUntil };
};

const refreshQueueLock = async (lockId) => {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + QUEUE_LOCK_TTL_MS);
  const lock = await AutoPoolLock.findOneAndUpdate(
    { key: QUEUE_LOCK_KEY, lockedBy: lockId },
    { $set: { lockedUntil } },
    { new: true },
  );

  if (!lock) return null;
  return { lockId, lockedUntil: lock.lockedUntil };
};

const releaseQueueLock = async (lockId) => {
  return AutoPoolLock.findOneAndUpdate(
    { key: QUEUE_LOCK_KEY, lockedBy: lockId },
    { $set: { lockedUntil: null, lockedBy: null, lockedAt: null } },
    { new: true },
  );
};

const getNextQueuePosition = async (session) => {
  const counter = await AutoPoolCounter.findOneAndUpdate(
    { key: QUEUE_COUNTER_KEY },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session },
  );
  return counter.seq;
};

const createRebirthNode = async (payload, session) => {
  const rebirth = await RebirthId.findOneAndUpdate(
    { rebirthCode: payload.rebirthCode },
    { $setOnInsert: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true, session },
  );
  return rebirth;
};

const attachRebirthChild = async (parentId, childId, session) => {
  const updated = await RebirthId.findOneAndUpdate(
    {
      _id: parentId,
      rebirthChildrenCount: { $lt: MAX_REBIRTH_CHILDREN },
      rebirthChildren: { $ne: childId },
    },
    {
      $addToSet: { rebirthChildren: childId },
      $inc: { rebirthChildrenCount: 1 },
    },
    { new: true, session },
  );

  if (!updated) {
    const parent = await RebirthId.findById(parentId).session(session);
    const alreadyLinked = parent?.rebirthChildren?.some(
      (id) => String(id) === String(childId),
    );
    if (alreadyLinked) {
      return parent;
    }
    throw new Error("Rebirth parent has no available child slot");
  }

  return updated;
};

const enqueueRebirthNode = async (rebirthNodeId, session) => {
  const queuePosition = await getNextQueuePosition(session);

  return AutoPoolQueue.findOneAndUpdate(
    { rebirthNodeId },
    {
      $setOnInsert: {
        rebirthNodeId,
        queuePosition,
        processed: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, session },
  );
};

const reserveQueueItem = async (session) => {
  const lockId = new mongoose.Types.ObjectId().toString();
  return AutoPoolQueue.findOneAndUpdate(
    { processed: false, processingLockId: null },
    {
      $set: {
        processingLockId: lockId,
        processingStartedAt: new Date(),
      },
    },
    { sort: { queuePosition: 1 }, new: true, session },
  );
};

const releaseQueueItem = async (queueId, session) => {
  return AutoPoolQueue.findByIdAndUpdate(
    queueId,
    { $set: { processingLockId: null, processingStartedAt: null } },
    { new: true, session },
  );
};

const completeQueueItem = async (queueId, session) => {
  return AutoPoolQueue.findByIdAndUpdate(
    queueId,
    {
      $set: {
        processed: true,
        processedAt: new Date(),
        processingLockId: null,
        processingStartedAt: null,
      },
    },
    { new: true, session },
  );
};

const createPoolNode = async (rebirthNode, session) => {
  const poolNode = await AutopoolMatrix.findOneAndUpdate(
    { linkedRebirthNodeId: rebirthNode._id },
    {
      $setOnInsert: {
        poolNodeId: rebirthNode.rebirthCode,
        linkedRebirthNodeId: rebirthNode._id,
        status: "PENDING",
        autopoolChildrenCount: 0,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, session },
  );

  if (
    !rebirthNode.linkedPoolNodeId ||
    String(rebirthNode.linkedPoolNodeId) !== String(poolNode._id)
  ) {
    await RebirthId.findByIdAndUpdate(
      rebirthNode._id,
      { $set: { linkedPoolNodeId: poolNode._id } },
      { session },
    );
  }

  return poolNode;
};

const attachPoolChild = async (parentId, childId, session) => {
  const updated = await AutopoolMatrix.findOneAndUpdate(
    {
      _id: parentId,
      autopoolChildrenCount: { $lt: MAX_AUTOPOOL_CHILDREN },
      autopoolChildren: { $ne: childId },
      status: "PLACED",
    },
    {
      $addToSet: { autopoolChildren: childId },
      $inc: { autopoolChildrenCount: 1 },
    },
    { new: true, session },
  );

  if (!updated) {
    const parent = await AutopoolMatrix.findById(parentId).session(session);
    const alreadyLinked = parent?.autopoolChildren?.some(
      (id) => String(id) === String(childId),
    );
    if (alreadyLinked) {
      return parent;
    }
    throw new Error("Autopool parent has no available child slot");
  }

  return updated;
};

const completeAutopoolNode = async (poolNodeId, session) => {
  return AutopoolMatrix.findOneAndUpdate(
    {
      _id: poolNodeId,
      status: "PLACED",
      autopoolChildrenCount: MAX_AUTOPOOL_CHILDREN,
    },
    {
      $set: { status: "COMPLETED", completedAt: new Date() },
    },
    { new: true, session },
  );
};

const resolveRebirthChildren = async (parent, session) => {
  const parentGeneration = parent.generation || 0;
  const expectedChildren = [];

  for (let i = 1; i <= MAX_REBIRTH_CHILDREN; i += 1) {
    const rebirthCode = buildChildRebirthId(
      parent.rebirthCode,
      i,
      parentGeneration,
    );

    let child = await RebirthId.findOne({ rebirthCode }).session(session);

    if (!child) {
      child = await createRebirthNode(
        {
          ownerUserId: parent.ownerUserId,
          rebirthCode,
          parentRebirthId: parent._id,
          generation: parentGeneration + 1,
          rebirthChildren: [],
          rebirthChildrenCount: 0,
          status: "ACTIVE",
        },
        session,
      );
    } else if (!child.parentRebirthId) {
      const setUpdate = { parentRebirthId: parent._id };
      if (child.generation == null) {
        setUpdate.generation = parentGeneration + 1;
      }
      await RebirthId.findByIdAndUpdate(
        child._id,
        { $set: setUpdate },
        { session },
      );
      child.parentRebirthId = parent._id;
      if (child.generation == null) {
        child.generation = parentGeneration + 1;
      }
    }

    if (
      child.parentRebirthId &&
      String(child.parentRebirthId) !== String(parent._id)
    ) {
      console.warn(
        `[Autopool] Rebirth child ${rebirthCode} belongs to a different parent; skipping attach.`,
      );
      continue;
    }

    try {
      await attachRebirthChild(parent._id, child._id, session);
    } catch (error) {
      console.warn(
        `[Autopool] Failed to attach rebirth child ${rebirthCode} to ${parent.rebirthCode}.`,
        error,
      );
      continue;
    }

    expectedChildren.push(child.toObject ? child.toObject() : child);
  }

  return expectedChildren;
};

const generateRecursiveRebirths = async (completedRebirthNode, session) => {
  const parent = await RebirthId.findById(completedRebirthNode._id)
    .session(session)
    .lean();

  if (!parent) return { generated: 0 };

  const children = await resolveRebirthChildren(parent, session);

  if (children.length < MAX_REBIRTH_CHILDREN) {
    console.warn(
      `[Autopool] Skipping rebirth generation for ${parent.rebirthCode}; expected ${MAX_REBIRTH_CHILDREN} children, found ${children.length}.`,
    );
    return { generated: 0, skipped: true };
  }

  const targetChildren = children.slice(0, MAX_REBIRTH_CHILDREN);
  let generated = 0;

  for (const child of targetChildren) {
    for (let i = 1; i <= 2; i += 1) {
      const rebirthCode = buildChildRebirthId(
        child.rebirthCode,
        i,
        child.generation,
      );

      const newChild = await createRebirthNode(
        {
          ownerUserId: child.ownerUserId,
          rebirthCode,
          parentRebirthId: child._id,
          generation: (child.generation || 0) + 1,
          rebirthChildren: [],
          rebirthChildrenCount: 0,
          status: "ACTIVE",
        },
        session,
      );

      await attachRebirthChild(child._id, newChild._id, session);
      await enqueueRebirthNode(newChild._id, session);
      generated += 1;
    }
  }

  return { generated };
};

const placePoolNode = async (
  poolNode,
  parentPoolNode,
  queuePosition,
  session,
) => {
  const update = {
    status: "PLACED",
    parentPoolNodeId: parentPoolNode?._id || null,
    queuePosition: queuePosition || poolNode.queuePosition || null,
  };

  const updated = await AutopoolMatrix.findOneAndUpdate(
    { _id: poolNode._id, status: "PENDING" },
    { $set: update },
    { new: true, session },
  );

  if (!updated) return poolNode;

  if (!parentPoolNode) return updated;

  const updatedParent = await attachPoolChild(
    parentPoolNode._id,
    updated._id,
    session,
  );

  if (updatedParent.autopoolChildrenCount === MAX_AUTOPOOL_CHILDREN) {
    const completedParent = await completeAutopoolNode(
      updatedParent._id,
      session,
    );

    if (completedParent) {
      const rebirthNode = await RebirthId.findById(
        completedParent.linkedRebirthNodeId,
      )
        .session(session)
        .lean();

      if (rebirthNode) {
        await generateRecursiveRebirths(rebirthNode, session);
      }
    }
  }

  return updated;
};

export const autopoolService = {
  activateMemberInAutopool: async ({ userId, memberId }, session = null) => {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    let rootNode = await RebirthId.findOne({ rebirthCode: memberId }).session(
      session,
    );

    if (!rootNode) {
      rootNode = await createRebirthNode(
        {
          ownerUserId: userId,
          rebirthCode: memberId,
          parentRebirthId: null,
          generation: 0,
          rebirthChildren: [],
          rebirthChildrenCount: 0,
          status: "ACTIVE",
        },
        session,
      );
    }

    const [childOneId, childTwoId] = buildInitialRebirthIds(memberId);

    const childOne = await createRebirthNode(
      {
        ownerUserId: userId,
        rebirthCode: childOneId,
        parentRebirthId: rootNode._id,
        generation: 1,
        rebirthChildren: [],
        rebirthChildrenCount: 0,
        status: "ACTIVE",
      },
      session,
    );

    const childTwo = await createRebirthNode(
      {
        ownerUserId: userId,
        rebirthCode: childTwoId,
        parentRebirthId: rootNode._id,
        generation: 1,
        rebirthChildren: [],
        rebirthChildrenCount: 0,
        status: "ACTIVE",
      },
      session,
    );

    await attachRebirthChild(rootNode._id, childOne._id, session);
    await attachRebirthChild(rootNode._id, childTwo._id, session);

    await enqueueRebirthNode(rootNode._id, session);
    await enqueueRebirthNode(childOne._id, session);
    await enqueueRebirthNode(childTwo._id, session);

    return { rootNode, childNodes: [childOne, childTwo] };
  },

  enqueueRebirth: async (rebirthNodeId, session = null) => {
    return enqueueRebirthNode(rebirthNodeId, session);
  },

  processAutopoolQueue: async () => {
    if (await isAutopoolRepairLocked()) {
      return { processedCount: 0, skipped: true, repairLocked: true };
    }

    if (isQueueProcessing) {
      return { processedCount: 0, skipped: true };
    }

    let queueLock = await acquireQueueLock();
    if (!queueLock) {
      return { processedCount: 0, skipped: true, lockUnavailable: true };
    }

    isQueueProcessing = true;
    const MAX_PROCESS = 100;
    let processedCount = 0;

    try {
      while (processedCount < MAX_PROCESS) {
        const refreshed = await refreshQueueLock(queueLock.lockId);
        if (!refreshed) {
          console.warn("[Autopool] Queue lock lost; stopping processing.");
          break;
        }
        queueLock = refreshed;

        let attempts = 0;
        let processed = false;
        let shouldStop = false;

        while (!processed && attempts < MAX_QUEUE_RETRIES) {
          attempts += 1;
          const session = await mongoose.startSession();
          let queueItem = null;

          try {
            session.startTransaction({
              readConcern: { level: "snapshot" },
              writeConcern: { w: "majority" },
            });

            queueItem = await reserveQueueItem(session);
            if (!queueItem) {
              await session.commitTransaction();
              shouldStop = true;
              break;
            }

            const rebirthNode = await RebirthId.findById(
              queueItem.rebirthNodeId,
            )
              .session(session)
              .lean();

            if (!rebirthNode) {
              await completeQueueItem(queueItem._id, session);
              await session.commitTransaction();
              processedCount += 1;
              processed = true;
              continue;
            }

            const poolNode = await createPoolNode(rebirthNode, session);

            if (poolNode.status !== "PENDING") {
              await completeQueueItem(queueItem._id, session);
              await session.commitTransaction();
              processedCount += 1;
              processed = true;
              continue;
            }

            const parent = await AutopoolMatrix.findOne({
              status: "PLACED",
              autopoolChildrenCount: { $lt: MAX_AUTOPOOL_CHILDREN },
            })
              .sort({ createdAt: 1 })
              .session(session);

            await placePoolNode(
              poolNode,
              parent,
              queueItem.queuePosition,
              session,
            );

            await completeQueueItem(queueItem._id, session);
            await session.commitTransaction();
            processedCount += 1;
            processed = true;
          } catch (error) {
            if (session.inTransaction()) {
              await session.abortTransaction().catch(() => null);
            }
            if (queueItem?._id) {
              await releaseQueueItem(queueItem._id, null).catch(() => null);
            }

            if (
              isTransientTransactionError(error) &&
              attempts < MAX_QUEUE_RETRIES
            ) {
              console.warn(
                `[Autopool] Transient queue error, retrying (${attempts}/${MAX_QUEUE_RETRIES}).`,
                error,
              );
              await delay(80 * attempts);
              continue;
            }

            if (isTransientTransactionError(error)) {
              console.warn(
                "[Autopool] Transient queue error after retries; skipping this cycle.",
                error,
              );
              await delay(150 * attempts);
              processed = true;
              continue;
            }

            console.error("[Autopool] Queue processing error:", error);
            shouldStop = true;
            break;
          } finally {
            session.endSession();
          }
        }

        if (shouldStop) break;
      }

      return { processedCount };
    } finally {
      isQueueProcessing = false;
      await releaseQueueLock(queueLock.lockId).catch(() => null);
    }
  },

  getAutopoolQueue: async () => {
    return AutoPoolQueue.find({ processed: false })
      .sort({ queuePosition: 1 })
      .populate({
        path: "rebirthNodeId",
        populate: { path: "ownerUserId", select: "memberId fullName" },
      })
      .lean();
  },

  getAutopoolMatrix: async () => {
    return AutopoolMatrix.find({})
      .populate({
        path: "linkedRebirthNodeId",
        populate: { path: "ownerUserId", select: "memberId fullName" },
      })
      .populate("parentPoolNodeId", "poolNodeId")
      .sort({ createdAt: 1 })
      .lean();
  },

  getAutopoolNode: async (nodeId) => {
    return AutopoolMatrix.findById(nodeId)
      .populate({
        path: "linkedRebirthNodeId",
        populate: { path: "ownerUserId", select: "memberId fullName" },
      })
      .populate("parentPoolNodeId", "poolNodeId")
      .populate("autopoolChildren", "poolNodeId status")
      .lean();
  },

  getRebirthTreeByUser: async (userId) => {
    return RebirthId.find({ ownerUserId: userId })
      .populate("parentRebirthId", "rebirthCode")
      .populate("rebirthChildren", "rebirthCode")
      .sort({ createdAt: 1 })
      .lean();
  },
};
