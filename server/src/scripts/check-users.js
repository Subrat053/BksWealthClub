import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../modules/user/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const total = await User.countDocuments({});
    const simulated = await User.countDocuments({ fullName: /Simulated User/ });
    console.log(`DIAGNOSTIC: Total users: ${total}, Simulated users: ${simulated}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
