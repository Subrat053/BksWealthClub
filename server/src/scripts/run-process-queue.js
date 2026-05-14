#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import autopoolService from "../modules/autopool/autopool-3x3.service.js";
import mongoose from "mongoose";

(async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log("Processing AutoPool queue...");
    const res = await autopoolService.processAutoPoolQueue();
    console.log("Result:", res);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error processing queue:", err);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
})();
