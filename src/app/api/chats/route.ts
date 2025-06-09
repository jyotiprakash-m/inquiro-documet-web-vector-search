import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, type } = await request.json();

    if (!id || !title || !type) {
      return NextResponse.json(
        { error: "Missing id, title, or type" },
        { status: 400 }
      );
    }

    const validTypes = {
      batchResource: "batchResourceId",
      document: "documentId",
      webpage: "webPageId",
      share: "shareId",
    } as const;

    const relationKey = validTypes[type as keyof typeof validTypes];

    if (!relationKey) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const data = {
      userId,
      title,
      [relationKey]: id,
    };

    const chat = await prisma.chat.create({ data });

    return NextResponse.json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}

// Get all chats for a user and type
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const id = url.searchParams.get("id");

    if (!type) {
      return NextResponse.json(
        { error: "Missing type parameter" },
        { status: 400 }
      );
    }

    const validTypes = {
      batchResource: "batchResourceId",
      document: "documentId",
      webpage: "webPageId",
      share: "shareId",
    } as const;

    if (!type || !(type in validTypes)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const relationKey = validTypes[type as keyof typeof validTypes];

    const chats = await prisma.chat.findMany({
      where: { userId, [relationKey]: id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}
