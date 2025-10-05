import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";


import { initRedis,getRedis } from "./services/redisClient";
import { logger } from "./config/logger";

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());


app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 200
}));


(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    logger.info("Mongo connected");
    await initRedis(); 
    logger.info("Redis connected");
    app.use("/auth", authRoutes);

    const port = Number(process.env.PORT) || 4000;
app.listen(port, "0.0.0.0", () => {
  logger.info(`🚀 Server running on http://0.0.0.0:${port}`);
});
  } catch (err) {
    logger.error("Startup error", err);
    process.exit(1);
  }
})();
