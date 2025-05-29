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

//Get status of vectorization
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
    const status = progress === 100 ? "completed" : "processing";

    return NextResponse.json({ progress, status });
  } catch (error) {
    console.error("Error checking vectorization status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, type, content } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    if (!type || (type !== "document" && type !== "webpage")) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    let document: any;
    // Get document from database
    if (type === "document" && content) {
      document = await prisma.document.findUnique({
        where: { id },
      });
      vectorizeWebPage(document.id, content);
    }
    if (type === "webpage") {
      document = await prisma.webPage.findUnique({
        where: { id },
      });
      vectorizeDocument(document.id, document.fileUrl);
    }

    if (!document) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Check if document belongs to the user
    if (document.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Start vectorization process asynchronously

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error starting vectorization:", error);
    return NextResponse.json(
      { error: "Failed to start vectorization" },
      { status: 500 }
    );
  }
}

async function vectorizeDocument(documentId: string, documentUrl: string) {
  try {
    // Initialize progress
    vectorizationProgress.set(documentId, 0);

    // todo: Read file content from fileUrl (minio)
    const response = await fetch(documentUrl);
    if (!response.ok)
      throw new Error(`Failed to fetch: ${response.statusText}`);

    // Step 2: Read the blob as a buffer and convert to string
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileContent = buffer.toString("utf-8");

    // Split content into chunks (simplified for demonstration)
    const chunks = splitIntoChunks(fileContent, 1000);
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
          documentId: documentId,
        },
      });

      // Update progress
      const progress = Math.round(((i + 1) / totalChunks) * 100);
      vectorizationProgress.set(documentId, progress);
    }

    // Set final progress to 100%
    vectorizationProgress.set(documentId, 100);
  } catch (error) {
    console.error("Error during vectorization:", error);
    // Set progress to indicate failure
    vectorizationProgress.set(documentId, -1);
  }
}

async function vectorizeWebPage(webPageId: string, content: string) {
  try {
    // Initialize progress
    vectorizationProgress.set(webPageId, 0);

    // Split content into chunks (simplified for demonstration)
    const chunks = splitIntoChunks(content, 1000);
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

function splitIntoChunks(text: string, chunkSize: number): string[] {
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
