import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";
import crypto from "crypto";
import type { StoredItem, ListItem } from "./types";

// Redis hash key 混淆：避免 Upstash 控制台直接看到明文 "passman:entries"
// 设置环境变量 KV_KEY_SALT 后，key 名变为哈希值（新部署时启用）
// ⚠️ 注意：已有数据的部署修改 KV_KEY_SALT 会导致无法读取旧数据，需先迁移
const SET_KEY = process.env.KV_KEY_SALT
  ? "pm:" + crypto.createHash("sha256").update("passman:entries:" + process.env.KV_KEY_SALT).digest("hex")
  : "passman:entries";

export function generateId(): string {
  return nanoid(12);
}

export async function getAllItems(): Promise<ListItem[]> {
  const entries = await kv.hgetall<Record<string, StoredItem>>(SET_KEY);
  if (!entries) return [];
  return Object.entries(entries)
    .map(([id, item]) => ({
      id,
      website: item.website,
      url: item.url,
      username: item.username,
      createdAt: item.createdAt,
    }))
    .sort(
      (a, b) => Number(a.createdAt) - Number(b.createdAt)
    );
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
