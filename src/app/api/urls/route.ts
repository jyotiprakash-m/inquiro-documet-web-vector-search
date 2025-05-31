import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Fetch web page content
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch web page" },
        { status: 400 }
      );
    }
    const html = await response.text();
    const title = extractTitle(html) || url;
    //store web page metadata to database
    const webPage = await prisma.webPage.create({
      data: {
        url,
        title,
        userId: userId as string,
      },
    });
    const content = extractTextContent(html);

    //todo: call vectorize api here

    // get base url
    const baseUrl = request.nextUrl.origin;

    fetch(`${baseUrl}/api/vectorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: webPage.id,
        type: "webpage",
        content: content,
        userId: userId as string,
      }),
    });

    return NextResponse.json({
      success: true,
      webPageId: webPage.id,
    });
  } catch (error) {
    console.error("Error processing URL:", error);
    return NextResponse.json(
      { error: "Failed to process URL" },
      { status: 500 }
    );
  }
}

// return all web pages for the current user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all documents for the current user
    const documents = await prisma.webPage.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

export function extractTextContent(html: string): string {
  // Remove HTML tags and get text content (simplified)
  let text = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    " "
  );
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}
