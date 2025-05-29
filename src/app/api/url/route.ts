import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { OpenAI } from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Map to store vectorization progress
const vectorizationProgress = new Map<string, number>();

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

    // Extract title and text content (simplified)
    const title = extractTitle(html) || url;
    const content = extractTextContent(html);

    // Save web page metadata to database
    const webPage = await prisma.webPage.create({
      data: {
        url,
        title,
        userId,
      },
    });

    // Start vectorization process asynchronously
    vectorizeWebPage(webPage.id, content);

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

async function vectorizeWebPage(webPageId: string, content: string) {
  try {
    // Initialize progress
    vectorizationProgress.set(webPageId, 0);

    // Split content into chunks (simplified for demonstration)
    const chunks = splitIntoChunks(content);
    const totalChunks = chunks.length;

    // Process each chunk and update progress
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Generate embedding using OpenAI
      const embedding = await generateEmbedding(chunk);

      // Store vector in database
      await prisma.vector.create({
        data: {
          content: chunk,
          embedding: embedding,
          webPageId: webPageId,
        },
      });

      // Update progress
      const progress = Math.round(((i + 1) / totalChunks) * 100);
      vectorizationProgress.set(webPageId, progress);
    }

    // Set final progress to 100%
    vectorizationProgress.set(webPageId, 100);
  } catch (error) {
    console.error("Error during web page vectorization:", error);
    // Set progress to indicate failure
    vectorizationProgress.set(webPageId, -1);
  }
}

function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

function extractTextContent(html: string): string {
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

function splitIntoChunks(text: string, chunkSize: number = 1000): string[] {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}
