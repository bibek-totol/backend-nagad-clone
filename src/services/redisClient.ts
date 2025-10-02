import { createClient } from "redis";
import { logger } from "../config/logger";

let client: ReturnType<typeof createClient> | null = null;

export async function initRedis(url: string) {
  client = createClient({ url });
  client.on("error", (err) => logger.error("Redis error", err));
  await client.connect();
}

export function getRedis() {
  if (!client) throw new Error("Redis not initialized");
  return client;
}
