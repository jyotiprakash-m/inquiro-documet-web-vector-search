import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, type, shareUrl, token } = await request.json();

    if (!id || !type || !shareUrl || !token) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const validTypes = {
      batchResource: "batchResourceId",
      document: "documentId",
      webpage: "webPageId",
    } as const;

    const relationKey = validTypes[type as keyof typeof validTypes];

    if (!relationKey) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const data = {
      originalUrl: "",
      shareUrl,
      shareBy: userId,
      type,
      token,
      [relationKey]: id,
    };

    const share = await prisma.share.create({ data });
    //Generate original url
    const originalUrl = `${request.nextUrl.origin}/chat/share/${share.id}`;
    //update the originalUlr
    await prisma.share.update({
      where: { id: share.id },
      data: {
        originalUrl: originalUrl,
      },
    });

    return NextResponse.json({
      success: true,
      share,
    });
  } catch (error) {
    console.error("Error creating share:", error);
    return NextResponse.json(
      { error: "Failed to create share" },
      { status: 500 }
    );
  }
}

// Get all shares for a user and type
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shares = await prisma.share.findMany({
      where: { shareBy: userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(shares);
  } catch (error) {
    console.error("Error fetching shares:", error);
    return NextResponse.json(
      { error: "Failed to fetch shares" },
      { status: 500 }
    );
  }
}
