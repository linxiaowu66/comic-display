import { NextRequest, NextResponse } from "next/server";
import {
  getCachedSeries,
  cacheSeries,
  getCachedCharacters,
  cacheCharacters,
  getCachedStoryboard,
  cacheStoryboard,
} from "@/lib/server-storage";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = Number(searchParams.get("id"));

  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  switch (type) {
    case "series":
      return NextResponse.json({ data: await getCachedSeries(id) });
    case "characters":
      return NextResponse.json({ data: await getCachedCharacters(id) });
    case "storyboard":
      return NextResponse.json({ data: await getCachedStoryboard(id) });
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id, data } = body as {
      type: string;
      id: number;
      data: unknown[];
    };

    if (!type || !id || !data) {
      return NextResponse.json(
        { error: "Missing type, id, or data" },
        { status: 400 }
      );
    }

    switch (type) {
      case "series":
        await cacheSeries(id, data);
        break;
      case "characters":
        await cacheCharacters(id, data);
        break;
      case "storyboard":
        await cacheStoryboard(id, data);
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cache error:", error);
    return NextResponse.json({ error: "Failed to cache" }, { status: 500 });
  }
}
