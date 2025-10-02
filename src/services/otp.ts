import crypto from "crypto";
import { getRedis } from "./redisClient";
import { sendSms } from "./twilio";
import dotenv from "dotenv";
dotenv.config();

const LENGTH = Number(process.env.OTP_LENGTH || 6);
const TTL = Number(process.env.OTP_TTL_SECONDS || 300);

function genOtp() {
  let s = "";
  for (let i=0;i<LENGTH;i++) s += Math.floor(Math.random()*10).toString();
  return s;
}

export async function createAndSendOtp(phone: string, purpose = "login") {
  const otp = genOtp();
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHmac("sha256", salt).update(otp).digest("hex");

  const key = `otp:${purpose}:${phone}`;
  const redis = getRedis();
  await redis.hSet(key, { hash, salt, createdAt: Date.now().toString() });
  await redis.expire(key, TTL);

  // send sms (do not return otp in prod)
  await sendSms(phone, `Your verification code: ${otp}. Expires in ${Math.floor(TTL/60)} min`);
  return { ok: true };
}

export async function verifyOtp(phone: string, otpCandidate: string, purpose = "login") {
  const key = `otp:${purpose}:${phone}`;
  const redis = getRedis();
  const data = await redis.hGetAll(key);
  if (!data || !data.hash || !data.salt) return { ok: false, reason: "expired_or_not_found" };
  const candidate = crypto.createHmac("sha256", data.salt).update(otpCandidate).digest("hex");
  if (candidate === data.hash) {
    await redis.del(key);
    return { ok: true };
  }
  return { ok: false, reason: "invalid" };
}
