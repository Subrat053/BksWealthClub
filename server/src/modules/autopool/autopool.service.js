import mongoose from "mongoose";
import { AutopoolMatrix } from "./autopool-matrix.model.js";
import { AutoPoolQueue } from "./autopool-queue.model.js";
import { AutoPoolCounter } from "./autopool-counter.model.js";
import { RebirthId } from "./rebirth.model.js";
import { User } from "../user/user.model.js";
import {
  buildChildRebirthId,
  buildInitialRebirthIds,
  MAX_AUTOPOOL_CHILDREN,
  MAX_REBIRTH_CHILDREN,
} from "./autopool.engine.js";

const QUEUE_COUNTER_KEY = "autopool_queue_v3";

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

const generateRecursiveRebirths = async (completedRebirthNode, session) => {
  const parent = await RebirthId.findById(completedRebirthNode._id)
    .session(session)
    .lean();

  if (!parent) return { generated: 0 };

  const children = await RebirthId.find({
    _id: { $in: parent.rebirthChildren || [] },
  })
    .sort({ createdAt: 1 })
    .session(session)
    .lean();

  if (children.length < 2) {
    throw new Error("Rebirth node does not have two children for generation");
  }

  const targetChildren = children.slice(0, 2);
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

const placePoolNode = async (poolNode, parentPoolNode, queuePosition, session) => {
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
    const MAX_PROCESS = 100;
    let processedCount = 0;

    while (processedCount < MAX_PROCESS) {
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
          continue;
        }

        const poolNode = await createPoolNode(rebirthNode, session);

        if (poolNode.status !== "PENDING") {
          await completeQueueItem(queueItem._id, session);
          await session.commitTransaction();
          processedCount += 1;
          continue;
        }

        const parent = await AutopoolMatrix.findOne({
          status: "PLACED",
          autopoolChildrenCount: { $lt: MAX_AUTOPOOL_CHILDREN },
        })
          .sort({ createdAt: 1 })
          .session(session);

        await placePoolNode(poolNode, parent, queueItem.queuePosition, session);

        await completeQueueItem(queueItem._id, session);
        await session.commitTransaction();
        processedCount += 1;
      } catch (error) {
        await session.abortTransaction();
        if (queueItem?._id) {
          await releaseQueueItem(queueItem._id, null).catch(() => null);
        }
        console.error("[Autopool] Queue processing error:", error);
        break;
      } finally {
        session.endSession();
      }
    }

    return { processedCount };
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
