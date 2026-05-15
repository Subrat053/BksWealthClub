import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await mongoose.connection.db.collection('users').findOne({memberId:'BKS000000'});
    if (user) {
        // Delete all ledger entries except the basic completion ones
        const result = await mongoose.connection.db.collection('poolfundledgers').deleteMany({
            mainUserId: user._id, 
            type: { $nin: ['REBIRTH_AUTOPOOL_COMPLETED'] }
        });
        console.log(`Deleted ${result.deletedCount} partial entries for BKS000000`);
    }
    process.exit(0);
}
run();
