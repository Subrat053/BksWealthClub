import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { activationService } from "./activation.service.js";

export const requestActivationController = asyncHandler(async (req, res) => {
  const data = await activationService.requestActivation({ userId: req.user.sub });
  res.status(201).json(new ApiResponse({ message: "Activation request submitted", data }));
});

export const executeActivationController = asyncHandler(async (req, res) => {
  const data = await activationService.executeActivationWorkflow({ userId: req.user.sub });
  res.json(new ApiResponse({ message: "Activation workflow executed", data }));
});
