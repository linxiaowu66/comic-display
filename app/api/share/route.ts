import { NextRequest, NextResponse } from "next/server";
import {
  getSharedProjects,
  addSharedProject,
  removeSharedProject,
} from "@/lib/server-storage";

export async function GET() {
  const projects = getSharedProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, projectId } = body as {
      id: string;
      name: string;
      projectId: number;
    };

    if (!name || !projectId) {
      return NextResponse.json(
        { error: "Missing name or projectId" },
        { status: 400 }
      );
    }

    addSharedProject({ id, name, projectId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json({ error: "Failed to share" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    removeSharedProject(Number(projectId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unshare error:", error);
    return NextResponse.json({ error: "Failed to unshare" }, { status: 500 });
  }
}
