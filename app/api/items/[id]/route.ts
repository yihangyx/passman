import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { getItem, deleteItem } from "@/lib/kv";
import type { DecryptedItem } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = req.headers.get("Authorization") || "";
    if (!verifyToken(auth.replace("Bearer ", ""))) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const item = await getItem(params.id);
    if (!item) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }
    const decrypted: DecryptedItem = {
      id: params.id,
      website: item.website,
      url: item.url,
      username: item.username,
      password: decrypt(item.encPassword),
      notes: decrypt(item.encNotes),
      createdAt: item.createdAt,
    };
    return NextResponse.json(decrypted);
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