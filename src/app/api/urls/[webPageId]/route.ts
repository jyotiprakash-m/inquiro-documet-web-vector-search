import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const webPageId = url.pathname.split("/").pop();

    // Get webpage from database
    const webpage = await prisma.webPage.findUnique({
      where: { id: webPageId },
    });

    if (!webpage) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if webpage belongs to the user
    if (webpage.userId !== userId) {
      redirect("/dashboard");
      // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ webpage });
  } catch (error) {
    console.error("Error fetching webpage:", error);
    return NextResponse.json(
      { error: "Failed to fetch webpage" },
      { status: 500 }
    );
  }
}
