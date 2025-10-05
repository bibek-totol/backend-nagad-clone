import { Router } from "express";
import { requestOtpSchema, verifyOtpSchema } from "../validation/schemas";
import { createAndSendOtp, verifyOtp } from "../services/otp";
import User from "../models/User";
import { signAccess, signRefresh, verifyRefresh } from "../utils/token";
import { v4 as uuidv4 } from "uuid";
import { getRedis } from "../services/redisClient";

const router = Router();


router.post("/request-otp", async (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const { phone} = parsed.data;
  try {
    const redis = getRedis();
    const counterKey = `otp_counter:${phone}`;
    const window = Number(process.env.OTP_RATE_LIMIT_WINDOW || 1800);
    const max = Number(process.env.OTP_MAX_PER_WINDOW || 5);
    const count = Number(await redis.get(counterKey) || 0);
    if (count >= max) return res.status(429).json({ error: "Too many requests. You can send 5 request at a time. Wait for 30 minutes" });
    await redis.multi().incr(counterKey).expire(counterKey, window).exec();

    let user = await User.findOne({ phone });
    if (!user) { user = new User({ phone, refreshTokens: [] }); await user.save(); }


    if (user.isBlocked) return res.status(403).json({ error: "User blocked" });

    await createAndSendOtp(phone, "login");
    return res.json({ ok: true });
  } catch (err) { console.error(err); return res.status(500).json({ error: "internal" }); }
});


router.post("/verify-otp", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const { phone, otp} = parsed.data;
  try {
    const v = await verifyOtp(phone, otp, "login");
    if (!v.ok) return res.status(401).json({ error: v.reason || "invalid" });

    let user = await User.findOne({ phone });
    if (!user) { user = new User({ phone, refreshTokens: [] }); await user.save(); }

    const access = signAccess({ sub: user._id, phone });
    const jti = uuidv4();
    const refresh = signRefresh({ sub: user._id, jti });
    user.refreshTokens.push({ token: jti, issuedAt: new Date()});
    await user.save();

    res.cookie("refresh_token", refresh, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 30*24*3600*1000 });
    return res.json({ accessToken: access, expiresIn: process.env.ACCESS_TOKEN_EXP,ok: true });
  } catch (err) { console.error(err); return res.status(500).json({ error: "internal" }); }
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refresh_token || req.body.refreshToken;
  if (!token) return res.status(401).json({ error: "no_token" });
  const payload: any = verifyRefresh(token);
  if (!payload) return res.status(401).json({ error: "invalid" });
  try {
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "user_not_found" });
    const stored = user.refreshTokens.find(r => r.token === payload.jti);
    if (!stored) { user.refreshTokens = []; await user.save(); return res.status(401).json({ error: "token_reuse" }); }
    
    user.refreshTokens = user.refreshTokens.filter(r => r.token !== payload.jti);
    const newJti = uuidv4();
    const newRefresh = signRefresh({ sub: user._id, jti: newJti });
    user.refreshTokens.push({ token: newJti, issuedAt: new Date() });
    await user.save();
    const newAccess = signAccess({ sub: user._id, phone: user.phone });
    res.cookie("refresh_token", newRefresh, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
    return res.json({ accessToken: newAccess });
  } catch (err) { console.error(err); return res.status(500).json({ error: "internal" }); }
});

router.post("/logout", async (req, res) => {
  const token = req.cookies?.refresh_token || req.body.refreshToken;
  if (token) {
    try {
      const payload: any = verifyRefresh(token);
      if (payload) {
        const user = await User.findById(payload.sub);
        if (user) {
          user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== payload.jti);
          await user.save();
        }
      }
    } catch {

    }
  }
  res.clearCookie("refresh_token");
  return res.json({ ok: true });
});

export default router;
