import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    console.log("login user", userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shares = await prisma.shareAccess.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        share: {
          include: {
            batchResource: true,
            document: true,
            webPage: true,
          },
        },
      },
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
