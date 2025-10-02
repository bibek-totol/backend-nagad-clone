import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function signAccess(payload: object) {
  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET as string, // cast to string
    { expiresIn: (process.env.ACCESS_TOKEN_EXP as string) || "15m" } as SignOptions
  );
}

export function signRefresh(payload: object) {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET as string, // cast to string
    { expiresIn: (process.env.REFRESH_TOKEN_EXP as string) || "30d" } as SignOptions
  );
}

export function verifyAccess(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string);
  } catch {
    return null;
  }
}

export function verifyRefresh(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string);
  } catch {
    return null;
  }
}
