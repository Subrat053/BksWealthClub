import mongoose from 'mongoose';
import dotenv from 'dotenv';
import autopool3x3Service from '../modules/autopool/autopool-3x3.service.js';

dotenv.config({ path: './.env' });

async function rebuild() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    console.log('Starting AutoPool Queue Processing...');
    const result = await autopool3x3Service.processAutoPoolQueue();
    console.log(`Rebuild complete. Placed ${result.placedCount} nodes.`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

rebuild();
