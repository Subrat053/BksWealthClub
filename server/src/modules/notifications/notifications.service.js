import { NotificationModel } from "./notification.model.js";

export const notificationsService = {
  queueNotification: async (payload) => NotificationModel.create(payload),
  listUserNotifications: async (userRef) => NotificationModel.find({ userRef }).sort({ createdAt: -1 }).lean(),
};
