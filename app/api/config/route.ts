import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    bgUrl: process.env.BG_IMAGE_URL || "",
  });
}