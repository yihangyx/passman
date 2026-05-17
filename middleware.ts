import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const allowedIPs = process.env.ALLOWED_IPS;
  if (!allowedIPs) return NextResponse.next();

  const ips = allowedIPs.split(",").map((s) => s.trim()).filter(Boolean);
  if (ips.length === 0) return NextResponse.next();

  const clientIP =
    req.headers.get("x-vercel-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";

  if (!clientIP || !ips.includes(clientIP)) {
    return new NextResponse("Access Denied - IP Not Allowed", {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.next();
}

// 只拦截页面和 API 路由，不拦截静态资源
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};