import { type NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { spawn, exec } from "node:child_process";
import { prisma } from "@/lib/prisma";
import { OpenAI } from "openai";
import { promisify } from "node:util";
import { Readable } from "node:stream";
const execAsync = promisify(exec);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
// Check if pdftotext is installed
async function isPdftotextInstalled(): Promise<boolean> {
  try {
    await execAsync("which pdftotext");
    return true;
  } catch (error) {
    return false;
  }
}

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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    // Get progress from the map
    console.log("cool", id, vectorizationProgress.get(id));
    const progress = vectorizationProgress.get(id) || 0;
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
    const { id, type, content, userId } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    if (!["document", "webpage"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    const isWebPage = type === "webpage";
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    let document: any = null;

    if (isWebPage) {
      document = await prisma.webPage.findUnique({ where: { id } });
    } else {
      document = await prisma.document.findUnique({ where: { id } });
    }

    if (!document) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    if (document.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isWebPage && content) {
      vectorizeWebPage(document.id, content);
    } else if (!isWebPage && document.fileUrl) {
      vectorizeDocument(document.id, document.fileUrl);
    }

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
    const pdftotextInstalled = await isPdftotextInstalled();
    if (!pdftotextInstalled) {
      throw new Error("pdftotext is not installed on the server.");
    }

    // todo: Read file content from fileUrl (minio)
    const response = await fetch(documentUrl);

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }

    const pdfBuffer = await response.arrayBuffer();

    // Check if buffer is empty
    if (pdfBuffer.byteLength === 0) {
      throw new Error("Downloaded file is empty");
    }

    // Extract text using pdftotext with buffer input
    console.log("Extracting text from PDF buffer");
    const extractedText = await extractTextFromPdfBuffer(
      Buffer.from(pdfBuffer)
    );

    // Split content into chunks (simplified for demonstration)
    const chunks = splitIntoChunks(extractedText.trim(), 1000);
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
      console.log(`Progress for document ${documentId}: ${progress}%`);
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
      const progressbar = vectorizationProgress.get(webPageId);
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

// Function to extract text from PDF buffer using pdftotext
async function extractTextFromPdfBuffer(pdfBuffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a readable stream from the buffer
      const bufferStream = new Readable();
      bufferStream.push(pdfBuffer);
      bufferStream.push(null); // Signal the end of the stream

      // Spawn pdftotext process with stdin/stdout pipes
      const pdfToText = spawn("pdftotext", ["-", "-"]);

      // Collect stdout chunks
      const chunks: Buffer[] = [];
      pdfToText.stdout.on("data", (chunk) => {
        chunks.push(Buffer.from(chunk));
      });

      // Handle process completion
      pdfToText.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`pdftotext process exited with code ${code}`));
          return;
        }

        // Combine chunks and convert to string
        const textBuffer = Buffer.concat(chunks);
        resolve(textBuffer.toString("utf-8"));
      });

      // Handle process errors
      pdfToText.on("error", (err) => {
        reject(new Error(`pdftotext process error: ${err.message}`));
      });

      // Handle stderr output
      pdfToText.stderr.on("data", (data) => {
        console.error(`pdftotext stderr: ${data}`);
      });

      // Pipe the PDF buffer to pdftotext's stdin
      bufferStream.pipe(pdfToText.stdin);

      // Handle stdin errors
      pdfToText.stdin.on("error", (err) => {
        reject(new Error(`pdftotext stdin error: ${err.message}`));
      });
    } catch (error) {
      reject(
        new Error(
          `Failed to extract text: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        )
      );
    }
  });
}
