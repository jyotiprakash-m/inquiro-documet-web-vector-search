import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { OpenAI } from "openai";
import { readFile } from "node:fs/promises";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Map to store vectorization progress
const vectorizationProgress = new Map<string, number>();

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
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if document belongs to the user
    if (document.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Start vectorization process asynchronously
    vectorizeDocument(document.id, document.fileUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error starting vectorization:", error);
    return NextResponse.json(
      { error: "Failed to start vectorization" },
      { status: 500 }
    );
  }
}

async function vectorizeDocument(documentId: string, filePath: string) {
  try {
    // Initialize progress
    vectorizationProgress.set(documentId, 0);

    // Read file content
    const fileContent = await readFile(filePath, "utf-8");

    // Split content into chunks (simplified for demonstration)
    const chunks = splitIntoChunks(fileContent);
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
