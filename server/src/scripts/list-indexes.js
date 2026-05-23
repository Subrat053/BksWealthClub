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
  const indexes = await db.collection("autopoolqueues").indexes();
  console.log("Active indexes on autopoolqueues:");
  console.log(JSON.stringify(indexes, null, 2));
  await mongoose.disconnect();
}

main().catch(console.error);
