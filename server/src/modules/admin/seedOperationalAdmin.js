import { User } from "../user/user.model.js";
import { AutoPoolNode } from "../autopool/autopool-matrix.model.js";
import { RebirthId } from "../autopool/rebirth.model.js";
import { AutopoolQueueCounter } from "../autopool/autopool-queue-counter.model.js";
import autopool3x3Service from "../autopool/autopool-3x3.service.js";
import { env } from "../../config/env.js";
import { hashPassword } from "../../common/helpers/password.helper.js";
import { logger } from "../../common/logger/logger.js";

const DEFAULT_OPERATIONAL_ADMIN_MEMBER_ID = "BKS000000";
const DEFAULT_OPERATIONAL_ADMIN_EMAIL = "operational@bkswealthclub.local";
const DEFAULT_OPERATIONAL_ADMIN_PASSWORD = "OperationalAdmin@123";

/**
 * Seed the Operational Admin with a clean, deterministic state.
 *
 * After a full DB wipe this function:
 *   1. Creates the admin User document.
 *   2. Seeds the Referral-tree node for the admin.
 *   3. Initialises the global queue / placement counters.
 *   4. Creates BKS000000-0.1 as the ROOT node (PLACED, queueSerial=1, placementSerial=1).
 *   5. Creates BKS000000-0.2 as a PENDING REBIRTH node (queueSerial=2).
 *   6. Processes the queue so 0.2 is placed under 0.1.
 *
 * The BKS000000-0.1 node is the chronologically-first entry in the queue and
 * therefore becomes the root of the autopool tree.  BKS000000-0.2 is the
 * second entry and is placed under that root during queue processing.
 */
export async function seedOperationalAdmin() {
  // ─── 1. Resolve admin credentials ────────────────────────────────────────
  const memberId =
    process.env.OPERATIONAL_ADMIN_MEMBER_ID?.trim().toUpperCase() ||
    env.OPERATIONAL_ADMIN_MEMBER_ID ||
    DEFAULT_OPERATIONAL_ADMIN_MEMBER_ID;

  const email =
    process.env.OPERATIONAL_ADMIN_EMAIL?.trim().toLowerCase() ||
    DEFAULT_OPERATIONAL_ADMIN_EMAIL;

  const password =
    process.env.OPERATIONAL_ADMIN_PASSWORD?.trim() ||
    DEFAULT_OPERATIONAL_ADMIN_PASSWORD;

  // ─── 2. Create (or verify) the admin User document ───────────────────────
  let adminUser = await User.findOne({ memberId });

  if (!adminUser) {
    const passwordHash = await hashPassword(password);

    adminUser = await User.create({
      memberId,
      sponsorId: memberId,       // self-sponsored — root of referral tree
      sponsorUserId: null,
      referredByUserId: null,
      fullName: "Operational Admin",
      email,
      passwordHash,
      plainPassword: password,
      referralCode: memberId,
      referralLink: `${process.env.BASE_URL || "http://localhost:3000"}/register?ref=${memberId}`,
      registrationSource: "admin",
      status: "active",
      isEmailVerified: true,
      isActivated: true,
      activationStatus: "ACTIVE",
      isOperationalAdmin: true,
      isSystemRoot: true,
    });

    logger.info("Operational Admin created", { memberId });
  } else {
    // Ensure flags are correct even if admin already existed
    let changed = false;
    if (!adminUser.isOperationalAdmin) { adminUser.isOperationalAdmin = true; changed = true; }
    if (!adminUser.isSystemRoot)       { adminUser.isSystemRoot = true;       changed = true; }
    if (adminUser.status !== "active") {
      adminUser.status = "active";
      adminUser.isActivated = true;
      adminUser.isActive = true;
      adminUser.activationStatus = "ACTIVE";
      changed = true;
    }
    if (changed) await adminUser.save();
    logger.info("Operational Admin verified / updated", { memberId });
  }

  // ─── 3. Seed the Referral-tree node ──────────────────────────────────────
  try {
    const { referralService } = await import("../referral/referral.service.js");
    await referralService.createReferralTreeNode({
      userId: adminUser._id,
      sponsorUserId: null,
    });
  } catch (err) {
    logger.warn("Failed to seed referral tree for Operational Admin:", err.message);
  }

  // ─── 4. Seed AutoPool from scratch ───────────────────────────────────────
  try {
    // Rebirth timestamps — root slightly before second node so chronological
    // ordering is always deterministic.
    const ROOT_TS   = new Date("2000-01-01T00:00:00.000Z");
    const QUEUE2_TS = new Date("2000-01-01T00:00:01.000Z");

    const rootCode   = `${memberId}-0.1`;
    const queuedCode = `${memberId}-0.2`;

    // ── 4a. Initialise global counters (upsert so they always start at 2 since 2 nodes are placed) ──
    await AutopoolQueueCounter.findOneAndUpdate(
      { key: "GLOBAL_AUTOPOOL_QUEUE" },
      { $setOnInsert: { currentSerialNo: 2 } }, // 0.1 and 0.2 consumed serial 1 and 2
      { upsert: true, new: true }
    );
    await AutopoolQueueCounter.findOneAndUpdate(
      { key: "GLOBAL_AUTOPOOL_PLACEMENT" },
      { $setOnInsert: { currentSerialNo: 2 } }, // 0.1 and 0.2 consumed placement serial 1 and 2
      { upsert: true, new: true }
    );

    // ── 4b. Create ROOT rebirth (BKS000000-0.1) ────────────────────────────
    let rootRebirthDoc = await RebirthId.findOne({ displayCode: rootCode });
    if (!rootRebirthDoc) {
      rootRebirthDoc = await RebirthId.create({
        ownerUserId:   adminUser._id,
        ownerMemberId: memberId,
        rebirthCode:   rootCode,
        displayCode:   rootCode,
        sourceType:    "INITIAL",
        rebirthType:   "DEPOSIT_REBIRTH",
        sequenceNumber: 1,
        generation:    0,
        levelNumber:   0,
        levelSequence: 1,
        isInitialRebirth: true,
        usedInAutoPool:   true,
        status:           "PLACED",
        queueSerialNo:    1,
        placementSerialNo: 1,
        queueEnteredAt:   ROOT_TS,
        placedAt:         ROOT_TS,
        isPlaced:         true,
        isActiveInAutopool: true,
      });
      logger.info(`[Seed] Created ROOT RebirthId: ${rootCode}`);
    }

    let rootNode = await AutoPoolNode.findOne({ nodeCode: rootCode });
    if (!rootNode) {
      rootNode = await AutoPoolNode.create({
        ownerUserId:   adminUser._id,
        ownerMemberId: memberId,
        nodeCode:      rootCode,
        displayCode:   rootCode,
        nodeId:        rootCode,
        nodeType:      "ROOT",
        rebirthType:   "DEPOSIT_REBIRTH",
        rebirthId:     rootRebirthDoc._id,
        rebirthCode:   rootCode,
        levelNumber:   0,
        levelSequence: 1,
        status:        "PLACED",
        isRoot:        true,
        isPlaced:      true,
        parentNodeId:  null,
        matrixParentId: null,
        queueSerialNo:    1,
        placementSerialNo: 1,
        queueEnteredAt:   ROOT_TS,
        placedAt:         ROOT_TS,
        isActiveInAutopool: true,
        directChildrenCount: 0,
        directChildren: [],
      });
      logger.info(`[Seed] Created ROOT AutoPoolNode: ${rootCode}`);
    } else {
      // Ensure existing root node has correct flags
      rootNode.isRoot = true;
      rootNode.nodeType = "ROOT";
      rootNode.status = "PLACED";
      rootNode.isPlaced = true;
      rootNode.parentNodeId = null;
      rootNode.matrixParentId = null;
      rootNode.queueSerialNo = 1;
      rootNode.placementSerialNo = 1;
      rootNode.isActiveInAutopool = true;
      await rootNode.save();
      logger.info(`[Seed] Verified ROOT AutoPoolNode: ${rootCode}`);
    }

    // ── 4c. Create QUEUED second rebirth (BKS000000-0.2) ──────────────────
    let queuedRebirthDoc = await RebirthId.findOne({ displayCode: queuedCode });
    if (!queuedRebirthDoc) {
      queuedRebirthDoc = await RebirthId.create({
        ownerUserId:   adminUser._id,
        ownerMemberId: memberId,
        rebirthCode:   queuedCode,
        displayCode:   queuedCode,
        sourceType:    "INITIAL",
        rebirthType:   "DEPOSIT_REBIRTH",
        sequenceNumber: 2,
        generation:    0,
        levelNumber:   0,
        levelSequence: 2,
        isInitialRebirth: true,
        usedInAutoPool:   true,
        status:           "PLACED",
        queueSerialNo:    2,
        placementSerialNo: 2,
        queueEnteredAt:   QUEUE2_TS,
        placedAt:         QUEUE2_TS,
        isPlaced:         true,
        parentNodeId:     rootNode._id,
        childSlot:        1,
        isActiveInAutopool: true,
      });
      logger.info(`[Seed] Created PLACED RebirthId: ${queuedCode}`);
    } else {
      queuedRebirthDoc.status = "PLACED";
      queuedRebirthDoc.isPlaced = true;
      queuedRebirthDoc.parentNodeId = rootNode._id;
      queuedRebirthDoc.childSlot = 1;
      queuedRebirthDoc.placementSerialNo = 2;
      queuedRebirthDoc.placedAt = QUEUE2_TS;
      queuedRebirthDoc.queueSerialNo = 2;
      queuedRebirthDoc.isActiveInAutopool = true;
      await queuedRebirthDoc.save();
      logger.info(`[Seed] Verified and updated PLACED RebirthId: ${queuedCode}`);
    }

    let queuedNode = await AutoPoolNode.findOne({ nodeCode: queuedCode });
    if (!queuedNode) {
      queuedNode = await AutoPoolNode.create({
        ownerUserId:   adminUser._id,
        ownerMemberId: memberId,
        nodeCode:      queuedCode,
        displayCode:   queuedCode,
        nodeId:        queuedCode,
        nodeType:      "REBIRTH",
        rebirthType:   "DEPOSIT_REBIRTH",
        rebirthId:     queuedRebirthDoc._id,
        rebirthCode:   queuedCode,
        levelNumber:   0,
        levelSequence: 2,
        status:        "PLACED",
        isPlaced:      true,
        parentNodeId:  rootNode._id,
        matrixParentId: rootNode._id,
        childSlot:      1,
        queueSerialNo:  2,
        placementSerialNo: 2,
        queueEnteredAt: QUEUE2_TS,
        placedAt:       QUEUE2_TS,
        isActiveInAutopool: true,
      });
      logger.info(`[Seed] Created PLACED AutoPoolNode: ${queuedCode}`);
    } else {
      queuedNode.status = "PLACED";
      queuedNode.isPlaced = true;
      queuedNode.parentNodeId = rootNode._id;
      queuedNode.matrixParentId = rootNode._id;
      queuedNode.childSlot = 1;
      queuedNode.placementSerialNo = 2;
      queuedNode.placedAt = QUEUE2_TS;
      queuedNode.queueSerialNo = 2;
      queuedNode.isActiveInAutopool = true;
      await queuedNode.save();
      logger.info(`[Seed] Verified and updated PLACED AutoPoolNode: ${queuedCode}`);
    }

    // ── 4d. Establish explicit parent-child links on rootNode ───────────────
    if (!rootNode.directChildren.includes(queuedNode._id)) {
      rootNode.directChildren = [queuedNode._id];
      rootNode.directChildrenCount = 1;
      await rootNode.save();
      logger.info(`[Seed] Linked ${queuedCode} as child of ${rootCode}.`);
    }

    // ── 4e. Also seed the legacy RebirthModel (income/rebirth.model.js) ────
    // This model is used by the admin UI for visibility.
    try {
      const { RebirthModel } = await import("../income/rebirth.model.js");

      for (const [seq, code] of [[1, rootCode], [2, queuedCode]]) {
        const exists = await RebirthModel.findOne({ rebirthCode: code });
        if (!exists) {
          await RebirthModel.create({
            userId:          adminUser._id,
            rebirthCode:     code,
            sequenceNo:      seq,
            walletBalance:   0,
            sourceDepositId: null,
          });
          logger.info(`[Seed] Created legacy RebirthModel entry: ${code}`);
        }
      }
    } catch (err) {
      logger.warn("[Seed] Could not create legacy RebirthModel entries:", err.message);
    }

    // ── 4f. Process the queue chronologically until stable ────────────────
    await autopool3x3Service.processAutopoolUntilStable();

    logger.info("✅ Operational Admin AutoPool seeded successfully.", {
      rootNode:   rootCode,
      queuedNode: queuedCode,
    });
  } catch (err) {
    logger.error("❌ Failed to seed AutoPool for Operational Admin:", err);
    throw err;
  }
}
