import mongoose from "mongoose";
import { activationRepository } from "./activation.repository.js";
import { settingsService } from "../settings/settings.service.js";
import { autopoolService } from "../autopool/autopool.service.js";
import { User } from "../user/user.model.js";
import { ApiError } from "../../core/ApiError.js";

export const activationService = {
  /**
   * Member requests activation (creates a pending record).
   * Actual activation fires when the deposit is approved.
   */
  requestActivation: async ({ userId }) => {
    const rules = await settingsService.getPublicRules();
    const amount = Number(rules.activationAmountUsd || 75);

    const user = await User.findById(userId).lean();
    if (!user) throw new ApiError(404, "User not found");
    if (user.isActivated) throw new ApiError(400, "Account already activated");

    return activationRepository.create({
      userRef: userId,
      amount,
      status: "pending",
      triggeredBy: "wallet",
      note: "Activation request created. Awaiting deposit approval.",
    });
  },

  /**
   * Admin manually executes activation for a user (bypass deposit).
   * Useful for admin-added members or manual overrides.
   */
  adminExecuteActivation: async ({ userId }) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let shouldProcessQueue = false;

    try {
      const user = await User.findById(userId).session(session);
      if (!user) throw new ApiError(404, "User not found");
      if (user.isActivated) throw new ApiError(400, "Account already activated");

      // Create an activation record
      await activationRepository.create([
        {
          userRef: userId,
          amount: 75,
          status: "activated",
          triggeredBy: "admin",
          note: "Manually activated by admin",
        },
      ], { session });

      // Mark user as activated
      user.isActivated = true;
      user.status = "active";
      await user.save({ session });

      // Fire the autopool workflow (pass the session)
      const result = await autopoolService.activateMemberInAutopool(
        { userId: user._id, memberId: user.memberId },
        session,
      );
      shouldProcessQueue = true;

      await session.commitTransaction();

      if (shouldProcessQueue) {
        setImmediate(() => autopoolService.processAutopoolQueue());
      }
      return { activated: true, ...result };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },
};
