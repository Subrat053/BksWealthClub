import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { depositCredentialService } from "./depositCredential.service.js";
import { ApiError } from "../../core/ApiError.js";

export const getDepositCredentialsController = asyncHandler(async (req, res) => {
  const credentials = await depositCredentialService.getAll();
  res.json(new ApiResponse({ message: "Deposit credentials fetched", data: credentials }));
});

export const createDepositCredentialController = asyncHandler(async (req, res) => {
  const { network, walletAddress, qrCodeUrl, instructions, isActive } = req.body;
  if (!network) throw new ApiError(400, "Network is required");
  if (!walletAddress) throw new ApiError(400, "Wallet address is required");
  if (!qrCodeUrl) throw new ApiError(400, "QR code is required while creating");

  const credential = await depositCredentialService.create({
    network,
    walletAddress,
    qrCodeUrl,
    instructions,
    isActive: isActive === true || isActive === "true",
    updatedBy: req.auth.sub,
  });

  res.status(201).json(new ApiResponse({ message: "Deposit credential created", data: credential }));
});

export const updateDepositCredentialController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { network, walletAddress, qrCodeUrl, instructions, isActive } = req.body;
  
  if (!network) throw new ApiError(400, "Network is required");
  if (!walletAddress) throw new ApiError(400, "Wallet address is required");

  const credential = await depositCredentialService.update(id, {
    network,
    walletAddress,
    qrCodeUrl,
    instructions,
    isActive: isActive === true || isActive === "true",
    updatedBy: req.auth.sub,
  });

  res.json(new ApiResponse({ message: "Deposit credential updated", data: credential }));
});

export const activateDepositCredentialController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const credential = await depositCredentialService.activate(id, req.auth.sub);
  res.json(new ApiResponse({ message: "Deposit credential activated", data: credential }));
});

export const getActiveDepositCredentialController = asyncHandler(async (req, res) => {
  const credential = await depositCredentialService.getActive();
  res.json(new ApiResponse({ message: "Active deposit credential fetched", data: credential }));
});
