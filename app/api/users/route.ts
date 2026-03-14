import { NextResponse } from "next/server";
import { getUsers, saveUsers, AppUser } from "@/lib/server-storage";

export async function GET() {
  const users = await getUsers();
  // Don't send passwords back if not needed, but admin might need to see them to copy
  // Since it's a simple app for admin to view/copy generated passwords, we return full user objects.
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    const users = await getUsers();
    if (users.find(u => u.username === username)) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    // Generate random 10-char string for password
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newUser: AppUser = {
      id: crypto.randomUUID(),
      username,
      password,
      createdAt: Date.now(),
    };

    users.push(newUser);
    await saveUsers(users);

    return NextResponse.json(newUser);
  } catch (err) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
