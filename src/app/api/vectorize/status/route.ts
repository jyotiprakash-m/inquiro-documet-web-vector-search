import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Map to store vectorization progress
const vectorizationProgress = new Map<string, number>();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Get progress from the map
    const progress = vectorizationProgress.get(documentId) || 0;
    const status =
      progress === 100
        ? "completed"
        : progress === -1
        ? "failed"
        : "processing";

    return NextResponse.json({ progress, status });
  } catch (error) {
    console.error("Error checking vectorization status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}

// Export the progress map so it can be imported and used by other routes
export { vectorizationProgress };
