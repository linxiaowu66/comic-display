import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("comic-display-session");

  if (!session || !session.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const username = session.value;
  const isAdmin = username === (process.env.ADMIN_USERNAME || "admin");

  return NextResponse.json({ username, isAdmin });
}
