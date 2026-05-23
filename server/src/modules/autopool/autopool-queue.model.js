import mongoose from "mongoose";

/**
 * AutoPoolQueue Model
 * 
 * Serves as the single source of truth for event-driven FIFO queue processing.
 * Only rebirth IDs enter this queue.
 */
const autoPoolQueueSchema = new mongoose.Schema(
  {
    // Rebirth ID that is enqueued
    rebirthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RebirthId",
      required: true,
      unique: true,
      index: true,
    },

    // Global atomic FIFO sequence number assigned after enqueuing
    queueSerialNo: {
      type: Number,
      unique: true,
      sparse: true,
      index: true,
    },

    // Source classification for queue serial assignment priority
    queueSource: {
      type: String,
      enum: ["AUTOPOOL_GENERATED", "ALIAS_AUTO_DEPOSIT", "USER_DEPOSIT"],
      required: true,
      index: true,
    },

    // Queue item processing status
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PROCESSED", "DEAD_LETTER"],
      default: "PENDING",
      index: true,
    },

    // Worker retry tracking
    retryCount: {
      type: Number,
      default: 0,
    },

    // Exponent backoff delay in milliseconds
    retryBackoff: {
      type: Number,
      default: 1000,
    },

    // Next scheduled retry time for worker processing
    nextRetryAt: {
      type: Date,
      default: () => new Date(),
      index: true,
    },

    // Detailed error trace if processing fails
    failureReason: {
      type: String,
      default: null,
    },

    // Execution context snapshot on failure
    failureSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Worker instance identifier currently processing this item
    workerId: {
      type: String,
      default: null,
      index: true,
    },

    // Timestamp when worker started claiming this item
    startedAt: {
      type: Date,
      default: null,
    },

    // Timestamp when worker successfully finished placing this item
    processedAt: {
      type: Date,
      default: null,
    },

    // Time when this queue entry was created
    eventCreatedAt: {
      type: Date,
      default: () => new Date(),
    },

    // Reference to the triggering source event (e.g. Deposit or parent Node completion)
    sourceEventId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Type of source event (e.g. "DEPOSIT_SUCCESS", "REBIRTH_NODE_COMPLETED")
    sourceEventType: {
      type: String,
      default: null,
    },

    // Sequence index for events generated within a single batch
    eventSequence: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index for super-fast worker claiming: PENDING items sorted by chronological serial number
autoPoolQueueSchema.index({ status: 1, queueSerialNo: 1 });

// Compound index for checking items ready for retry
autoPoolQueueSchema.index({ status: 1, nextRetryAt: 1 });

export const AutoPoolQueue =
  mongoose.models.AutoPoolQueue ||
  mongoose.model("AutoPoolQueue", autoPoolQueueSchema);
