import { autopoolRepository } from "./autopool.repository.js";
import { planAutopoolPlacement } from "./autopool.engine.js";
import { settingsService } from "../settings/settings.service.js";

export const autopoolService = {
  getCommunityTree: async ({ userId }) => {
    const cycle = await autopoolRepository.findLatestCycleByUser(userId);
    if (!cycle) {
      return {
        cycle: null,
        nodes: [],
        message: "No autopool cycle found",
      };
    }

    const nodes = await autopoolRepository.findTreeByCycle(cycle._id);
    return { cycle, nodes };
  },

  placeMember: async ({ userId }) => {
    const settings = await settingsService.getPublicRules();
    const plan = planAutopoolPlacement({ userId, settings });
    return {
      plan,
      note: "Placement execution placeholder. Wire queue/node persistence in next iteration.",
    };
  },
};
