import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || process.env.ACCESS_PASSWORD || "";

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function base64urlDecode(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

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

export function verifyDecryptPassword(input: string): boolean {
  const expected = process.env.DECRYPT_PASSWORD;
  if (!expected) {
    return verifyPassword(input);
  }
  try {
    return crypto.timingSafeEqual(
      Buffer.from(input, "utf8"),
      Buffer.from(expected, "utf8")
    );
  } catch {
    return false;
  }
}

/** 生成 JWT，2 小时过期 */
export function generateToken(): string {
  const header = base64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    Buffer.from(
      JSON.stringify({ iat: now, exp: now + 2 * 3600, sub: "passman" })
    )
  );
  const sig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${sig}`;
}

/** 验证 JWT，检查过期时间 */
export function verifyToken(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [h, p, s] = parts;
    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${h}.${p}`)
      .digest("base64url");
    if (
      !crypto.timingSafeEqual(
        Buffer.from(s, "base64url"),
        Buffer.from(expectedSig, "base64url")
      )
    ) {
      return false;
    }
    const payloadData = JSON.parse(base64urlDecode(p).toString());
    if (payloadData.exp < Math.floor(Date.now() / 1000)) {
      return false; // 已过期
    }
    return true;
  } catch {
    return false;
  }
}
