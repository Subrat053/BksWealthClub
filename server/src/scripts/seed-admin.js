import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedOperationalAdmin } from '../modules/admin/seedOperationalAdmin.js';

dotenv.config({ path: './.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    await seedOperationalAdmin();
    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
