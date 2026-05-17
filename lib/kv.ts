import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";
import crypto from "crypto";
import type { StoredItem, ListItem } from "./types";

// Redis hash key 混淆
const SET_KEY = process.env.KV_KEY_SALT
  ? "pm:" + crypto.createHash("sha256").update("passman:entries:" + process.env.KV_KEY_SALT).digest("hex")
  : "passman:entries";

export function generateId(): string {
  return nanoid(12);
}

/** 获取所有条目（含加密 notes，由调用方解密） */
export async function getAllItems(): Promise<(ListItem & { encNotes: string })[]> {
  const entries = await kv.hgetall<Record<string, StoredItem>>(SET_KEY);
  if (!entries) return [];
  return Object.entries(entries)
    .map(([id, item]) => ({
      id,
      website: item.website,
      url: item.url,
      username: item.username,
      notes: item.encNotes, // 暂时存加密值，API 层解密后替换
      encNotes: item.encNotes,
      createdAt: item.createdAt,
    }))
    .sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
}

export async function getItem(id: string): Promise<StoredItem | null> {
  return await kv.hget<StoredItem>(SET_KEY, id);
}

export async function addItem(item: StoredItem): Promise<string> {
  const id = generateId();
  await kv.hset(SET_KEY, { [id]: item });
  return id;
}

export async function deleteItem(id: string): Promise<boolean> {
  const result = await kv.hdel(SET_KEY, id);
  return result > 0;
}