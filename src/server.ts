import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";


import { initRedis } from "./services/redisClient";
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
    await initRedis(process.env.REDIS_URL!);
    logger.info("Redis connected");

    app.use("/auth", authRoutes);

    const port = process.env.PORT || 4000;
    app.listen(port, () => logger.info(`Server listening ${port}`));
  } catch (err) {
    logger.error("Startup error", err);
    process.exit(1);
  }
})();
