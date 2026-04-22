import { ActivationModel } from "./activation.model.js";

export const activationRepository = {
  create: async (payload) => ActivationModel.create(payload),
  getByUser: async (userRef) => ActivationModel.find({ userRef }).sort({ createdAt: -1 }).lean(),
};
