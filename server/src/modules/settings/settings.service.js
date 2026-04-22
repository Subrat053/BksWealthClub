import { DEFAULT_SETTINGS } from "../../common/constants/index.js";
import { SettingModel } from "./settings.model.js";

export const settingsService = {
  getPublicRules: async () => {
    const rows = await SettingModel.find({}).lean();
    if (!rows.length) return DEFAULT_SETTINGS;

    return rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, { ...DEFAULT_SETTINGS });
  },

  getAllSettings: async () => SettingModel.find({}).sort({ key: 1 }).lean(),

  upsertSetting: async ({ key, value, description }) =>
    SettingModel.findOneAndUpdate(
      { key },
      { key, value, description: description || "" },
      { upsert: true, new: true },
    ).lean(),
};
