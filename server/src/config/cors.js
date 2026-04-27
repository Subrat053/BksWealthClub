import cors from "cors";
import { env } from "./env.js";

export const corsMiddleware = cors({
  origin: [env.CLIENT_URL, env.ADMIN_URL, "http://localhost:5175"],
  credentials: true,
});
