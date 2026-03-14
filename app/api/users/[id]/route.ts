import { NextResponse } from "next/server";
import { getUsers, saveUsers, AppUser } from "@/lib/server-storage";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const users = await getUsers();
    const updatedUsers = users.filter((u) => u.id !== id);

    if (users.length === updatedUsers.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await saveUsers(updatedUsers);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { username, resetPassword } = await req.json();

    const users = await getUsers();
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[userIndex];

    if (username) {
      // Check if another user has this username
      const existingUser = users.find((u) => u.username === username && u.id !== id);
      if (existingUser) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 });
      }
      user.username = username;
    }

    if (resetPassword) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let password = "";
      for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      user.password = password;
    }

    users[userIndex] = user;
    await saveUsers(users);

    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json({ error: "Failed to edit user" }, { status: 500 });
  }
}
