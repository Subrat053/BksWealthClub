import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in environment");
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });

  const db = mongoose.connection.db;
  const collName = "autopoolqueues";

  const exists = (await db.listCollections({ name: collName }).toArray()).length > 0;
  if (!exists) {
    console.log(`Collection ${collName} does not exist`);
    await mongoose.disconnect();
    return;
  }

  const indexes = await db.collection(collName).indexes();
  const idx = indexes.find((i) => i.name === "nodeId_1");
  if (!idx) {
    console.log("Index nodeId_1 not found, nothing to drop.");
    await mongoose.disconnect();
    return;
  }

  try {
    await db.collection(collName).dropIndex("nodeId_1");
    console.log("Dropped index nodeId_1 on collection", collName);
  } catch (err) {
    console.error("Failed to drop index:", err.message || err);
    process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
