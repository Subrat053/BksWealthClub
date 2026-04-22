import { activationRepository } from "./activation.repository.js";
import { settingsService } from "../settings/settings.service.js";
import { autopoolService } from "../autopool/autopool.service.js";

export const activationService = {
  requestActivation: async ({ userId }) => {
    const rules = await settingsService.getPublicRules();
    const amount = Number(rules.activationAmountUsd || 75);

    return activationRepository.create({
      userRef: userId,
      amount,
      status: "pending",
      triggeredBy: "wallet",
      note: "Activation request created",
    });
  },

  executeActivationWorkflow: async ({ userId }) => {
    const placement = await autopoolService.placeMember({ userId });
    return {
      activated: true,
      placement,
      note: "Activation workflow placeholder. Update user status and ledger transactions in next phase.",
    };
  },
};
