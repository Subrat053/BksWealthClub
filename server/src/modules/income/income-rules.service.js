import { settingsService } from "../settings/settings.service.js";

export const incomeRulesService = {
  getRules: async () => settingsService.getPublicRules(),

  getRuleValue: async (ruleKey, fallback = 0) => {
    const rules = await settingsService.getPublicRules();
    return Number(rules?.[ruleKey] ?? fallback);
  },
};
