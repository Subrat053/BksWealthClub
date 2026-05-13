# AutoPool 3x3 Matrix Implementation Guide

## Overview

This document describes the 3x3 Matrix AutoPool system with Rebirth IDs implementation for the BksWealthClub MLM platform.

## System Architecture

### Key Components

1. **Rebirth Model** - Tracks rebirth IDs generated for users
2. **AutoPool Node Model** - Represents nodes in the 3x3 matrix
3. **AutoPool Service (3x3)** - Business logic for queue processing and placement
4. **Deposit Integration** - Triggers AutoPool when deposit approved
5. **Background Job** - Continuous queue processing every 10 seconds
6. **API Endpoints** - Admin and user interfaces

## Database Models

### RebirthId Schema

```javascript
{
  ownerUserId: ObjectId,           // User who owns this rebirth
  depositId: ObjectId,              // Original deposit
  rebirthCode: String (unique),     // e.g., "BKS1001-R1"
  sequenceNumber: Number,           // 1 or 2 for ordering
  generation: Number,               // 0 (initial), 1, 2, ... (progressive)
  parentRebirthId: ObjectId,        // Parent rebirth (null for initial)
  generatedFromPoolNodeId: ObjectId, // Node that generated this
  isInitialRebirth: Boolean,        // true for -R1, -R2
  usedInAutoPool: Boolean,          // Has it been queued?
  status: String,                   // ACTIVE, PENDING, PLACED, COMPLETED
  createdAt: Date,
  updatedAt: Date
}
```

### AutoPoolNode Schema

```javascript
{
  ownerUserId: ObjectId,           // Node owner
  nodeCode: String (unique),       // e.g., "BKS1001" or "BKS1001-R1"
  nodeType: String,                // "MAIN" or "REBIRTH"
  userId: ObjectId,                // User reference (MAIN nodes only)
  rebirthId: ObjectId,             // Rebirth reference (REBIRTH nodes only)
  generatedFromNodeId: ObjectId,   // Node that generated this (rebirth nodes)
  depositId: ObjectId,             // Initiating deposit
  queueTimestamp: Date,            // When entered queue (for FIFO)
  status: String,                  // PENDING, PLACED, COMPLETED
  matrixParentId: ObjectId,        // Parent node (null for root)
  directChildren: [ObjectId],      // Child nodes
  directChildrenCount: Number,     // 0-3
  rebirthGenerated: Boolean,       // Have rebirths been created?
  rebirthGeneratedAt: Date,        // When rebirths were created
  completedAt: Date,               // When node completed (3 children)
  createdAt: Date,
  updatedAt: Date
}
```

## Process Flow

### 1. User Deposits (≥ $75)

```
User deposits $75
    ↓
Deposit approved by admin
    ↓
depositService.approveRequest() called
    ↓
autopool3x3Service.processDepositSuccessForAutoPool(depositId)
    ↓
Check if already processed (rebirthProcessed, autoPoolProcessed flags)
    ↓
Create 2 initial rebirth IDs (R1, R2)
    ↓
Create 3 AutoPool nodes:
  - 1 MAIN node (user's memberId)
  - 2 REBIRTH nodes (for R1 and R2)
    ↓
Add all 3 nodes to queue (status: PENDING)
    ↓
Mark deposit.rebirthProcessed = true
Mark deposit.autoPoolProcessed = true
    ↓
Set shouldProcessAutoPoolQueue flag
```

### 2. Queue Processing (Every 10 seconds)

```
registerAutopool3x3Job() runs every 10 seconds
    ↓
autopool3x3Service.processAutoPoolQueue()
    ↓
LOOP: While nodes to process AND limit not reached
  ↓
  Find oldest PENDING node by queueTimestamp
  If not found, exit loop
  ↓
  If first node (no parent), place as root:
    - Set status = PLACED
    - Set matrixParentId = null
  ↓
  If not first node, find oldest PLACED parent with < 3 children:
    ↓
    Atomically update parent (check directChildrenCount < 3):
      - $push child ID to directChildren
      - $inc directChildrenCount
    ↓
    If count now = 3, trigger completion:
      completeAutoPoolNode(parentId)
    ↓
  Update child:
    - status = PLACED
    - matrixParentId = parent._id
```

### 3. Node Completion (When 3 Children)

```
directChildrenCount reaches 3
    ↓
Auto-trigger completeAutoPoolNode()
    ↓
Check if already COMPLETED (guard)
Check if directChildrenCount === 3 (guard)
    ↓
Mark status = COMPLETED
Set completedAt = now
    ↓
Check if rebirthGenerated === true (guard)
    ↓
Generate 2 new rebirth IDs:
  - Parent code: BKS1001-R1
  - Children: BKS1001-R1-X1, BKS1001-R1-X2
  - Or deeper: BKS1001-R1-X1-X1, etc.
    ↓
Create 2 new RebirthId records
Create 2 new AutoPoolNode records (REBIRTH type, status PENDING)
    ↓
Enqueue both rebirth nodes
    ↓
Mark rebirthGenerated = true
Set rebirthGeneratedAt = now
```

### 4. Rebirth Code Generation Rules

```
Initial rebirths (generation 0):
  Main: BKS1001
  R1: BKS1001-R1
  R2: BKS1001-R2

When BKS1001-R1 completes (generation 1):
  X1: BKS1001-R1-X1
  X2: BKS1001-R1-X2

When BKS1001-R1-X1 completes (generation 2):
  A1: BKS1001-R1-X1-A1
  A2: BKS1001-R1-X1-A2

Pattern:
  - Initial: -R[sequence]
  - Gen 1+: -X[sequence] or -A[sequence]
```

## Duplicate Prevention

### 1. Rebirth Duplicates

**Unique Index:**
```javascript
rebirthSchema.index({ rebirthCode: 1 }, { unique: true });
```

**Check on Create:**
```javascript
const existing = await RebirthId.findOne({ rebirthCode }).session(session);
if (existing) return existing; // Reuse instead of creating
```

**Compound Index for Initial Rebirths:**
```javascript
rebirthSchema.index({ depositId: 1, ownerUserId: 1, sequenceNumber: 1 }, { sparse: true });
```

### 2. Node Duplicates

**Unique Index:**
```javascript
autopoolNodeSchema.index({ nodeCode: 1 }, { unique: true });
```

**Compound Indexes:**
```javascript
// For MAIN nodes (one per user, one per deposit)
autopoolNodeSchema.index({ depositId: 1, ownerUserId: 1, nodeType: 1 }, { sparse: true });

// For REBIRTH nodes (unique rebirth)
autopoolNodeSchema.index({ rebirthId: 1 }, { sparse: true });
```

**Check Before Create:**
```javascript
const existing = await AutoPoolNode.findOne({
  rebirthId: rebirthId,
  nodeType: "REBIRTH"
}).session(session);
if (existing) return existing;
```

### 3. Deposit Processing Guard

```javascript
// In approveRequest()
if (deposit.rebirthProcessed && deposit.autoPoolProcessed) {
  return { skipped: true, message: "Already processed" };
}
```

## Concurrency Safety

### 1. Transaction Retry Wrapper

```javascript
async function withTransactionRetry(fn, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction({ readConcern: "snapshot", writeConcern: "majority" });
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      if (isTransientError(err) && attempt < retries) {
        // Retry with backoff
        await delay(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw err;
    }
  }
}
```

### 2. Atomic Parent Update

```javascript
const updateResult = await AutoPoolNode.findOneAndUpdate(
  {
    _id: parentId,
    directChildrenCount: { $lt: 3 } // Atomic condition
  },
  {
    $push: { directChildren: childId },
    $inc: { directChildrenCount: 1 }
  },
  { new: true, session }
);

if (!updateResult) {
  // Parent was updated by concurrent process, retry
  continue; // Find new parent
}
```

### 3. Rebirth Generation Guard

```javascript
if (node.rebirthGenerated) {
  console.log("Rebirths already generated");
  return node; // Don't generate again
}
```

## API Endpoints

### Admin Endpoints

#### Get AutoPool Tree
```
GET /api/v1/autopool/3x3/admin/tree?limit=100

Response:
{
  success: true,
  data: {
    nodeCount: 50,
    nodes: [...]
  }
}
```

#### Get Queue Status
```
GET /api/v1/autopool/3x3/admin/queue

Response:
{
  success: true,
  data: {
    pending: 15,
    placed: 30,
    completed: 5,
    total: 50
  }
}
```

#### Get Completed Nodes
```
GET /api/v1/autopool/3x3/admin/completed?limit=100

Response:
{
  success: true,
  data: {
    completedCount: 5,
    nodes: [...]
  }
}
```

#### Get User AutoPool Details
```
GET /api/v1/autopool/3x3/admin/user/:userId

Response:
{
  success: true,
  data: {
    user: {...},
    autoPoolNodes: {
      count: 3,
      nodes: [...]
    },
    rebirthIds: {
      count: 2,
      rebirths: [...]
    }
  }
}
```

#### Process Queue Manually
```
POST /api/v1/autopool/3x3/admin/process-queue

Response:
{
  success: true,
  message: "Processed 25 nodes. More nodes to process.",
  data: {
    placedCount: 25,
    completed: false
  }
}
```

### User Endpoints

#### Get My AutoPool Nodes
```
GET /api/v1/autopool/3x3/my

Response:
{
  success: true,
  data: {
    nodeCount: 3,
    nodes: [...]
  }
}
```

#### Get My Rebirths
```
GET /api/v1/autopool/3x3/my-rebirths

Response:
{
  success: true,
  data: {
    rebirthCount: 2,
    rebirths: [...]
  }
}
```

#### Get My AutoPool Summary
```
GET /api/v1/autopool/3x3/my/summary

Response:
{
  success: true,
  data: {
    stats: {
      totalNodes: 3,
      pending: 3,
      placed: 0,
      completed: 0
    },
    rebirths: {
      count: 2,
      rebirths: [...]
    },
    nodes: [...]
  }
}
```

## Configuration

### Queue Processing Interval
File: `src/jobs/autopool.job.js`
```javascript
// Runs every 10 seconds
setInterval(runQueue, 10000);
```

### Transaction Settings
```javascript
{
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" }
}
```

### Max Retries
```javascript
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 100;
```

## Monitoring & Debugging

### Queue Status Endpoint
Use this regularly to monitor queue health:
```
GET /api/v1/autopool/3x3/admin/queue
```

### Manual Queue Processing
Force process queue if needed:
```
POST /api/v1/autopool/3x3/admin/process-queue
```

### Database Queries

**Find all PENDING nodes:**
```javascript
db.autopoolnodes.find({ status: "PENDING" }).sort({ queueTimestamp: 1 })
```

**Find all COMPLETED nodes:**
```javascript
db.autopoolnodes.find({ status: "COMPLETED" }).sort({ completedAt: -1 })
```

**Find user's rebirths:**
```javascript
db.rebirthids.find({ ownerUserId: ObjectId(...) }).sort({ generation: 1, sequenceNumber: 1 })
```

## Troubleshooting

### Issue: Nodes Not Being Placed

**Solution:**
1. Check queue status: `GET /api/v1/autopool/3x3/admin/queue`
2. Manually process queue: `POST /api/v1/autopool/3x3/admin/process-queue`
3. Check server logs for errors
4. Verify MongoDB connection

### Issue: Duplicate Rebirth IDs

**Solution:**
1. Rebirths should be unique due to index
2. If duplicates exist, use unique ID to identify
3. Check depositId + ownerUserId + sequenceNumber
4. Manually fix in admin panel if needed

### Issue: Parent Node Won't Complete

**Solution:**
1. Check directChildrenCount: `db.autopoolnodes.findOne({ _id: ObjectId(...) }).directChildrenCount`
2. Should be exactly 3 to complete
3. If not 3, nodes may have failed to add
4. Check transaction logs

## Migration Notes

- Old AutoPool system still exists alongside new 3x3 system
- Both can operate independently
- Existing referral tree is unaffected
- No data migration needed; new deposits use new system

## Performance Considerations

1. **FIFO Queue:** Uses `queueTimestamp` index for efficient sorting
2. **Parent Lookup:** Compound index on `status`, `directChildrenCount`, `queueTimestamp`
3. **Batch Processing:** Max 100 nodes per cycle to prevent long locks
4. **Session Transactions:** Atomic updates prevent race conditions

## Security

1. **Admin Only:** Tree/queue endpoints require admin privileges
2. **User Isolation:** User endpoints only show their own data
3. **No Privilege Escalation:** Users cannot view other users' AutoPool data
4. **Audit Trail:** All operations logged with timestamps

## Future Enhancements

1. Income calculation on completion
2. Commission distribution from completed nodes
3. AutoPool level bonuses
4. Admin panel visualizations
5. Email notifications on milestones
6. Historical reporting
