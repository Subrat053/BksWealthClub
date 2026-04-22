import mongoose from "mongoose";
import { USER_ROLES } from "../../common/enums/index.js";

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: [USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN], default: USER_ROLES.ADMIN },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export const AdminModel = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
