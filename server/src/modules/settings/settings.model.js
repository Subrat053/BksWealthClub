import mongoose from "mongoose";
import { DEFAULT_SETTINGS } from "../../common/constants/index.js";

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

settingsSchema.statics.getDefaults = function getDefaults() {
  return DEFAULT_SETTINGS;
};

export const SettingModel = mongoose.models.Setting || mongoose.model("Setting", settingsSchema);
