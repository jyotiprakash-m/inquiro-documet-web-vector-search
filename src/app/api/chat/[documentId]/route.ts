import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OpenAI } from "openai";
import { prisma } from "@/lib/prisma";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const documentId = url.pathname.split("/").pop();
    const { messages } = await request.json();
    const lastMessage = messages[messages.length - 1].content;

    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        vectors: true,
      },
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

    // Generate embedding for the query
    const queryEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: lastMessage,
    });

    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

    // Find relevant document chunks using vector similarity
    // Note: In a real implementation, you would use a vector database with similarity search
    // For simplicity, we're using a basic approach here
    const relevantChunks = findMostSimilarChunks(
      queryEmbedding,
      document.vectors,
      3
    );

    // Combine relevant chunks into context
    const context = relevantChunks.map((v) => v.content).join("\n\n");

    // Generate response using OpenAI
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that answers questions based on the provided document context. 
          Only answer what can be inferred from the context. If you don't know the answer, say so.
          
          Context from the document:
          ${context}`,
        },
        ...messages,
      ],
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of chatResponse) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      },
    });

    // Return streaming response
    // const stream = OpenAI.streamUtils.toReadableStream(chatResponse);
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}

// Function to find most similar chunks based on cosine similarity
function findMostSimilarChunks(
  queryEmbedding: number[],
  vectors: any[],
  count: number
) {
  // Calculate cosine similarity for each vector
  const vectorsWithSimilarity = vectors.map((vector) => {
    const similarity = calculateCosineSimilarity(
      queryEmbedding,
      vector.embedding
    );
    return { ...vector, similarity };
  });

  // Sort by similarity (descending) and take top results
  return vectorsWithSimilarity
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, count);
}

// Calculate cosine similarity between two vectors
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}
