import { z } from "zod";
export const requestOtpSchema = z.object({ phone: z.string().min(11).max(16)});
export const verifyOtpSchema = z.object({ phone: z.string().min(11).max(16), otp: z.string().min(6).max(8)});
