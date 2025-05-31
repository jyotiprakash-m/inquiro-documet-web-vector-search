import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL(request.url);
    const batchResourceId = url.pathname.split("/").pop();

    // Get batchResource from database
    const batchResource = await prisma.batchResource.findUnique({
      where: { id: batchResourceId },
    });

    if (!batchResource) {
      return NextResponse.json(
        { error: "Batch Resource not found" },
        { status: 404 }
      );
    }

    // Check if batchResource belongs to the user
    if (batchResource.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ batchResource });
  } catch (error) {
    console.error("Error fetching batchResource:", error);
    return NextResponse.json(
      { error: "Failed to fetch batchResource" },
      { status: 500 }
    );
  }
}

// Delete batchResource
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL(request.url);
    const batchResourceId = url.pathname.split("/").pop();

    // Get batchResource from database
    const batchResource = await prisma.batchResource.findUnique({
      where: { id: batchResourceId },
    });

    if (!batchResource) {
      return NextResponse.json(
        { error: "Batch Resource not found" },
        { status: 404 }
      );
    }

    // Check if batchResource belongs to the user
    if (batchResource.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.batchResource.delete({
      where: { id: batchResourceId },
    });

    return NextResponse.json({
      message: "Batch Resource deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting batchResource:", error);
    return NextResponse.json(
      { error: "Failed to delete batchResource" },
      { status: 500 }
    );
  }
}
