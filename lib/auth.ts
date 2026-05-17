import crypto from "crypto";

export function verifyPassword(input: string): boolean {
  const expected = process.env.ACCESS_PASSWORD;
  if (!expected) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(input, "utf8"),
      Buffer.from(expected, "utf8")
    );
  } catch {
    return false;
  }
}

export function generateToken(): string {
  const password = process.env.ACCESS_PASSWORD || "";
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyToken(token: string): boolean {
  return token === generateToken();
}