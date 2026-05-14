import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const schema = new mongoose.Schema({}, { strict: false });
const Node = mongoose.model("AutoPoolNode", schema, "autopoolnodes");

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const adminMemberId = process.env.OPERATIONAL_ADMIN_MEMBER_ID || "BK000000";
    const nodes = await Node.find({
      nodeCode: {
        $in: [adminMemberId, `${adminMemberId}-R1`, `${adminMemberId}-R2`],
      },
    }).lean();
    console.log(JSON.stringify(nodes, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
