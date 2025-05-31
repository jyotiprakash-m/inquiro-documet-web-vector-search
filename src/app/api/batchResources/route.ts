import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all batchResources for the current user
    const batchResources = await prisma.batchResource.findMany({
      where: {
        userId: userId,
      },
      include: {
        documents: true,
        webPages: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ batchResources });
  } catch (error) {
    console.error("Error fetching batchResources:", error);
    return NextResponse.json(
      { error: "Failed to fetch batchResources" },
      { status: 500 }
    );
  }
}
