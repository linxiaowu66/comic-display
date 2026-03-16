import { NextRequest, NextResponse } from "next/server";
import {
  getSharedProjects,
  addSharedProject,
  removeSharedProject,
} from "@/lib/server-storage";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("comic-display-session");
  const isAdmin = session?.value === (process.env.ADMIN_USERNAME || "admin");

  const allProjects = await getSharedProjects();

  if (isAdmin) {
    return NextResponse.json({ projects: allProjects });
  } else {
    // Only return shared projects for non-admin, and strip token/sensitive info
    const publicProjects = allProjects
      .filter((p) => p.isShared)
      .map((p) => ({
        id: p.id,
        name: p.name,
        projectId: p.projectId,
        source: p.source,
      }));
    return NextResponse.json({ projects: publicProjects });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("comic-display-session");
    if (session?.value !== (process.env.ADMIN_USERNAME || "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, projectId, source, token, fragmentId, userId, isShared } = body;

    if (!name || !projectId) {
      return NextResponse.json(
        { error: "Missing name or projectId" },
        { status: 400 }
      );
    }

    await addSharedProject({
      id,
      name,
      projectId: Number(projectId),
      source,
      token,
      fragmentId: fragmentId ? Number(fragmentId) : undefined,
      userId: userId ? Number(userId) : undefined,
      isShared: !!isShared,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project add/update error:", error);
    return NextResponse.json({ error: "Failed to save project" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("comic-display-session");
    if (session?.value !== (process.env.ADMIN_USERNAME || "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    await removeSharedProject(Number(projectId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project delete error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}