import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  await mongoose.connect('mongodb+srv://hotasubrat7268:qL3y6rL0kTGNq778@bks-2.zjfvej5.mongodb.net/?appName=bks-2');
  const db = mongoose.connection.db;
  console.log('Starting migration...');

  // 1. Update rebirths collection
  const rebirths = await db.collection('rebirths').find().toArray();
  for (const rb of rebirths) {
    if (rb.rebirthCode && (rb.rebirthCode.includes('-RB') || rb.rebirthCode.includes(' RB'))) {
      const newCode = rb.rebirthCode
        .replace('-RB1', '-0.1')
        .replace('-RB2', '-0.2')
        .replace(' RB1', '-0.1')
        .replace(' RB2', '-0.2')
        .replace('-RB-1', '-0.1')
        .replace('-RB-2', '-0.2');
      
      if (newCode !== rb.rebirthCode) {
        await db.collection('rebirths').updateOne({ _id: rb._id }, { $set: { rebirthCode: newCode } });
        console.log(`Updated rebirth: ${rb.rebirthCode} -> ${newCode}`);
      }
    }
  }

  // 2. Update autopoolnodes collection
  const nodes = await db.collection('autopoolnodes').find().toArray();
  for (const node of nodes) {
    if (node.nodeCode && (node.nodeCode.includes('-RB') || node.nodeCode.includes(' RB'))) {
      const newCode = node.nodeCode
        .replace('-RB1', '-0.1')
        .replace('-RB2', '-0.2')
        .replace(' RB1', '-0.1')
        .replace(' RB2', '-0.2')
        .replace('-RB-1', '-0.1')
        .replace('-RB-2', '-0.2');

      if (newCode !== node.nodeCode) {
        await db.collection('autopoolnodes').updateOne(
          { _id: node._id }, 
          { $set: { nodeCode: newCode, displayCode: newCode } }
        );
        console.log(`Updated node: ${node.nodeCode} -> ${newCode}`);
      }
    }
  }

  console.log('Migration complete');
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
