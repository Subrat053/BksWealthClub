import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: { type: String, enum: ["email", "sms", "in_app"], default: "in_app" },
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
  },
  { timestamps: true },
);

export const NotificationModel =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
