import { NextRequest, NextResponse } from "next/server";
import { verifyToken, verifyDecryptPassword } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { getItem, deleteItem } from "@/lib/kv";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = req.headers.get("Authorization") || "";
    if (!verifyToken(auth.replace("Bearer ", ""))) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const body = await req.json();
    const { password } = body;
    if (!password) {
      return NextResponse.json({ error: "需要二次密码" }, { status: 400 });
    }
    if (!verifyDecryptPassword(password)) {
      return NextResponse.json({ error: "二次密码错误" }, { status: 401 });
    }
    const item = await getItem(params.id);
    if (!item) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }
    return NextResponse.json({
      id: params.id,
      website: item.website,
      url: item.url,
      username: item.username,
      password: decrypt(item.encPassword),
      notes: decrypt(item.encNotes),
      createdAt: item.createdAt,
    });
  } catch (e) {
    return NextResponse.json({ error: "解密失败" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = req.headers.get("Authorization") || "";
    if (!verifyToken(auth.replace("Bearer ", ""))) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const ok = await deleteItem(params.id);
    if (!ok) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}