import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { uploadsService } from "./uploads.service.js";

export const uploadFileController = asyncHandler(async (req, res) => {
  const data = await uploadsService.uploadSingle({
    file: req.file,
    folder: req.body.folder,
  });

  res.status(201).json(new ApiResponse({ message: "File uploaded", data }));
});
