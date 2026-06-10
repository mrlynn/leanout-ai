import crypto from "crypto";
import bcrypt from "bcryptjs";

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken(): { token: string; hash: string; expires: Date } {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);
  return { token, hash, expires };
}

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
