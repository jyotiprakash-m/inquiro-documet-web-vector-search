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
    const token = url.pathname.split("/").pop();

    // Get share from database
    const share = await prisma.share.findUnique({
      where: { token },
      include: {
        batchResource: true,
        document: true,
        webPage: true,
      },
    });

    if (!share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    return NextResponse.json({ share });
  } catch (error) {
    console.error("Error fetching share:", error);
    return NextResponse.json(
      { error: "Failed to fetch share" },
      { status: 500 }
    );
  }
}
