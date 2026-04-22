import { AuditLogModel } from "./audit.model.js";

export const auditService = {
  log: async (payload) => AuditLogModel.create(payload),
  list: async (query = {}) => AuditLogModel.find(query).sort({ createdAt: -1 }).lean(),
};
