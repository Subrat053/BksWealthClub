import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const ledger = await mongoose.connection.db.collection('poolfundledgers').find({type:'REBIRTH_AUTOPOOL_COMPLETED'}).toArray();
    const nodeIds = ledger.map(l => l.completedRebirthId);
    const nodes = await mongoose.connection.db.collection('autopoolnodes').find({_id: { $in: nodeIds }}).toArray();
    console.log('Nodes in ledger:', nodes.map(n => n.nodeCode));
    
    const allCompletedNodes = await mongoose.connection.db.collection('autopoolnodes').find({status:'COMPLETED'}).toArray();
    console.log('All completed nodes:', allCompletedNodes.map(n => n.nodeCode));
    
    process.exit(0);
}
run();
