import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, generateToken } from "@/lib/auth";
import { kv } from "@vercel/kv";

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 900; // 15 分钟
const KV_PREFIX = "ratelimit:login";

function getClientIP(req: NextRequest): string {
  // 优先使用 Vercel 专用头（更难伪造）
  const vercelIP = req.headers.get("x-vercel-forwarded-for");
  if (vercelIP) return vercelIP;
  // x-real-ip 次优先
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP;
  // 最后用 x-forwarded-for 的第一个
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const rateKey = `${KV_PREFIX}:${ip}`;

    // 检查是否在锁定期
    const attempts = await kv.get<number>(rateKey);
    if (attempts && attempts >= MAX_ATTEMPTS) {
      const ttl = await kv.ttl(rateKey);
      if (ttl > 0) {
        return NextResponse.json(
          { error: `登录尝试次数过多，请 ${Math.ceil(ttl / 60)} 分钟后再试` },
          { status: 429 }
        );
      }
      // TTL 已过，清除旧记录
      await kv.del(rateKey);
    }

    const { password } = await req.json();

    if (!password || !verifyPassword(password)) {
      // 记录失败
      const newCount = await kv.incr(rateKey);
      if (newCount === 1) {
        // 首次失败，设 15 分钟窗口
        await kv.expire(rateKey, LOCKOUT_SECONDS);
      }
      const remaining = MAX_ATTEMPTS - newCount;
      if (remaining <= 0) {
        return NextResponse.json(
          { error: "登录尝试次数过多，请 15 分钟后再试" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `密码错误（还剩 ${remaining} 次机会）` },
        { status: 401 }
      );
    }

    // 登录成功 - 清除速率限制
    await kv.del(rateKey);

    return NextResponse.json({ token: generateToken() });
  } catch (e) {
    return NextResponse.json({ error: "请求无效" }, { status: 400 });
  }
}