import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { autopoolService } from "./autopool.service.js";

export const getCommunityTreeController = asyncHandler(async (req, res) => {
  const data = await autopoolService.getCommunityTree({ userId: req.user.sub });
  res.json(new ApiResponse({ message: "Autopool tree fetched", data }));
});

export const placeMemberController = asyncHandler(async (req, res) => {
  const data = await autopoolService.placeMember({ userId: req.body.userId || req.user.sub });
  res.json(new ApiResponse({ message: "Autopool placement planned", data }));
});
