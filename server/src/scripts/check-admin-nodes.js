import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const schema = new mongoose.Schema({}, { strict: false });
const Node = mongoose.model('AutoPoolNode', schema, 'autopoolnodes');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const nodes = await Node.find({ 
      nodeCode: { $in: ['BKS000000', 'BKS000000-R1', 'BKS000000-R2'] } 
    }).lean();
    console.log(JSON.stringify(nodes, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
