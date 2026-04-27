import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { teamService } from "./team.service.js";

export const getDirectTeamController = asyncHandler(async (req, res) => {
  const data = await teamService.getDirectTeam({ userId: req.auth.sub, query: req.query });
  res.json(new ApiResponse({ message: "Direct team fetched", data }));
});

export const getGenerationTeamController = asyncHandler(async (req, res) => {
  const data = await teamService.getGenerationTeam({ userId: req.auth.sub, query: req.query });
  res.json(new ApiResponse({ message: "Generation team fetched", data }));
});

export const getHierarchyController = asyncHandler(async (req, res) => {
  const data = await teamService.getHierarchy({ userId: req.auth.sub });
  res.json(new ApiResponse({ message: "Hierarchy fetched", data }));
});
