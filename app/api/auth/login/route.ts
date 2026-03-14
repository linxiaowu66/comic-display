import { NextResponse } from "next/server";
import { getUser, addLoginRecord } from "@/lib/server-storage";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "请输入用户名和密码" }, { status: 400 });
    }

    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    let isValid = false;
    let isAdmin = false;

    if (username === adminUsername && password === adminPassword) {
      isValid = true;
      isAdmin = true;
    } else {
      const user = await getUser(username);
      if (user && user.password === password) {
        isValid = true;
        isAdmin = false;
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    if (!isAdmin) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
      await addLoginRecord({
        id: crypto.randomUUID(),
        username,
        ip: ip.trim(),
        timestamp: Date.now()
      });
    }

    const response = NextResponse.json({ success: true, username, isAdmin });
    
    // Set an HTTP-only cookie
    // In a real app this should be a JWT or secure session token
    response.cookies.set({
      name: "comic-display-session",
      value: username,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
