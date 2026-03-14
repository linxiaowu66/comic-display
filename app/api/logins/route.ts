import { NextResponse } from "next/server";
import { getLoginRecords } from "@/lib/server-storage";

export async function GET() {
  try {
    const records = await getLoginRecords();
    // Sort by timestamp descending (newest first)
    records.sort((a, b) => b.timestamp - a.timestamp);
    return NextResponse.json(records);
  } catch (err) {
    return NextResponse.json({ error: "无法获取登录记录" }, { status: 500 });
  }
}
