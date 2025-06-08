import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { decodeShareUrl } from "@/lib/shareUrlUtils";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    const { shareBy, id } = await request.json();
    if (!userId || userId === shareBy) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id || !shareBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // If shareUrl is unique, make sure it's marked as @unique in your Prisma schema
    const existingShare = await prisma.share.findUnique({
      where: { id },
    });
    const encode = existingShare?.token;

    // lets decode
    const decode = decodeShareUrl(encode as string);
    if (decode.e && Number(decode.e) < Date.now()) {
      return NextResponse.json(
        { error: "Share link has expired" },
        { status: 400 }
      );
    }

    // Check allocatedCounts
    if (existingShare && existingShare.allocatedCounts >= Number(decode.m)) {
      return NextResponse.json(
        { error: "Share link has reached its maximum allocation" },
        { status: 400 }
      );
    }

    const share = await prisma.shareAccess.create({
      data: {
        userId: userId,
        shareId: existingShare?.id as string,
      },
    });
    // Increment allocatedCounts
    await prisma.share.update({
      where: { id: existingShare?.id },
      data: {
        allocatedCounts: {
          increment: 1,
        },
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
