import { AutopoolCycleModel, AutopoolNodeModel } from "./autopool.model.js";

export const autopoolRepository = {
  createNode: async (payload) => AutopoolNodeModel.create(payload),
  createCycle: async (payload) => AutopoolCycleModel.create(payload),
  findTreeByCycle: async (cycleRef) => AutopoolNodeModel.find({ cycleRef }).lean(),
  findLatestCycleByUser: async (userRef) => AutopoolCycleModel.findOne({ userRef }).sort({ createdAt: -1 }).lean(),
};
