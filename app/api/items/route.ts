import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { getAllItems, addItem, getItem } from "@/lib/kv";
import type { StoredItem, DecryptedItem } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization") || "";
    if (!verifyToken(auth.replace("Bearer ", ""))) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const items = await getAllItems();
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization") || "";
    if (!verifyToken(auth.replace("Bearer ", ""))) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const { website, url, username, password, notes } = await req.json();
    if (!website || !username || !password) {
      return NextResponse.json({ error: "网站、账号、密码为必填项" }, { status: 400 });
    }
    const now = Date.now().toString();
    const storedItem: StoredItem = {
      website,
      url: url || "",
      username,
      encPassword: encrypt(password),
      encNotes: encrypt(notes || ""),
      createdAt: now,
      updatedAt: now,
    };
    const id = await addItem(storedItem);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "添加失败" }, { status: 500 });
  }
}