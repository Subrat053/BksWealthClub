import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './.env' });

const schema = new mongoose.Schema({}, { strict: false });
const Node = mongoose.model('AutoPoolNode', schema, 'autopoolnodes');

async function checkNodes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    const nodes = await Node.find({ 
      nodeCode: { $in: ['BKS000000', 'BKS849093'] } 
    }).lean();
    console.log(JSON.stringify(nodes, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkNodes();
