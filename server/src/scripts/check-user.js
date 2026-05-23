import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const userId = new mongoose.Types.ObjectId("6a116ab6b67536851c1b331b");
  const depositId = new mongoose.Types.ObjectId("6a116ab6b67536851c1b3321");

  const user = await db.collection("users").findOne({ _id: userId });
  const deposit = await db.collection("deposits").findOne({ _id: depositId });

  console.log("User details:", JSON.stringify(user, null, 2));
  console.log("Deposit details:", JSON.stringify(deposit, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
