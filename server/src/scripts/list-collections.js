#!/usr/bin/env node

import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://alokmishra9861_db_user:123BKS@bksdemo.f7rkvkp.mongodb.net/?appName=BKSDemo";

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    console.log("[DEBUG] Listing all collections:");
    const collections = await db.listCollections().toArray();
    collections.forEach((c) => {
      console.log(`  - ${c.name}`);
    });

    // Try to find rebirthid collection
    const rebirthCollections = collections.filter((c) =>
      c.name.toLowerCase().includes("rebirth"),
    );
    console.log("\n[DEBUG] Rebirth-related collections:");
    rebirthCollections.forEach((c) => console.log(`  - ${c.name}`));

    // Count documents in each rebirth collection
    for (const collection of rebirthCollections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  ${collection.name}: ${count} documents`);
    }

    process.exit(0);
  } catch (err) {
    console.error("[ERROR]", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

main();
