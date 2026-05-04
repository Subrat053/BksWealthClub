import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { autopoolService } from "./autopool.service.js";

// Member: view their own subtree
export const getMemberTreeController = asyncHandler(async (req, res) => {
  const data = await autopoolService.getMemberTree({ userId: req.auth.sub });
  res.json(new ApiResponse({ message: "Autopool tree fetched", data }));
});

// Admin: view full community pool tree
export const getCommunityTreeController = asyncHandler(async (req, res) => {
  const data = await autopoolService.getCommunityTree();
  res.json(
    new ApiResponse({ message: "Community autopool tree fetched", data }),
  );
});

// Admin: pool stats
export const getPoolStatsController = asyncHandler(async (req, res) => {
  const data = await autopoolService.getPoolStats();
  res.json(new ApiResponse({ message: "Pool stats fetched", data }));
});
