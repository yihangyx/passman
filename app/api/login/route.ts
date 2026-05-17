import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, generateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password || !verifyPassword(password)) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }
    return NextResponse.json({ token: generateToken() });
  } catch {
    return NextResponse.json({ error: "请求无效" }, { status: 400 });
  }
}