import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../common/logger/logger.js";

async function ensureUserSponsorIndex() {
  const { User } = await import("../modules/user/user.model.js");
  
  try {
    await User.createCollection();
  } catch (err) {
    // Ignore if collection already exists
  }
  
  let indexes = [];
  try {
    indexes = await User.collection.indexes();
  } catch (err) {
    // If it still fails, skip index modifications
    return;
  }

  const dropLegacyUniqueIndex = async (keyName) => {
    const uniqueIndex = indexes.find(
      (index) => index?.key?.[keyName] === 1 && index.unique,
    );

    if (uniqueIndex) {
      await User.collection.dropIndex(uniqueIndex.name);
      logger.info(
        `Dropped legacy unique ${keyName} index: ${uniqueIndex.name}`,
      );
    }
  };

  const ensureNonUniqueIndex = async (keyName) => {
    const hasNonUniqueIndex = indexes.some(
      (index) => index?.key?.[keyName] === 1 && !index.unique,
    );

    if (!hasNonUniqueIndex) {
      await User.collection.createIndex({ [keyName]: 1 });
      logger.info(`Ensured non-unique ${keyName} index on users collection`);
    }
  };

  await dropLegacyUniqueIndex("sponsorId");
  await dropLegacyUniqueIndex("sponsorUserId");
  await ensureNonUniqueIndex("sponsorId");
  await ensureNonUniqueIndex("sponsorUserId");
}

export async function connectDatabase() {
  if (!env.MONGODB_URI) {
    logger.warn(
      "MONGODB_URI not provided. Starting without database connection.",
    );
    return false;
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== "production",
      serverSelectionTimeoutMS: 10000,
    });

    await ensureUserSponsorIndex();

    logger.info("MongoDB connected");
    return true;
  } catch (error) {
    logger.error("MongoDB connection failed", error);
    return false;
  }
}
