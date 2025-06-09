// /api/chat/[type]/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OpenAI } from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const type = segments[segments.length - 2];
    const id = segments[segments.length - 1];
    const { messages, prompt, chatId } = await request.json();

    if (!prompt || !messages)
      return NextResponse.json(
        { error: "Missing prompt or messages" },
        { status: 400 }
      );

    let document: any;
    switch (type) {
      case "batchResource":
        document = await prisma.batchResource.findUnique({
          where: { id },
          include: {
            documents: { include: { vectors: true } },
            webPages: { include: { vectors: true } },
          },
        });
        break;
      case "document":
        document = await prisma.document.findUnique({
          where: { id },
          include: { vectors: true },
        });
        break;
      case "webpage":
        document = await prisma.webPage.findUnique({
          where: { id },
          include: { vectors: true },
        });
        break;
      case "share":
        const share = await prisma.share.findUnique({
          where: { id },
        });
        if (!share) {
          return NextResponse.json(
            { error: "Share not found" },
            { status: 404 }
          );
        }
        if (share.type === "document") {
          document = await prisma.document.findUnique({
            where: { id: share.documentId as string },
            include: { vectors: true },
          });
        } else if (share.type === "webpage") {
          document = await prisma.webPage.findUnique({
            where: { id: share.webPageId as string },
            include: { vectors: true },
          });
        } else if (share.type === "batchResource") {
          document = await prisma.batchResource.findUnique({
            where: { id: share.batchResourceId as string },
            include: {
              documents: { include: { vectors: true } },
              webPages: { include: { vectors: true } },
            },
          });
        } else {
          return NextResponse.json(
            { error: "Invalid share type" },
            { status: 400 }
          );
        }
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (!document)
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );

    if (document.userId !== userId && type !== "share")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Save the user message to the chat pick the last message
    const lastMessage = messages[messages.length - 1];
    await prisma.message.create({
      data: {
        content: lastMessage.content,
        role: lastMessage.role,
        chatId: chatId,
        id: lastMessage.id,
      },
    });

    const queryEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: prompt,
    });

    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;
    const allVectors =
      type === "batchResource"
        ? [
            ...document.documents.flatMap((doc: any) => doc.vectors),
            ...document.webPages.flatMap((page: any) => page.vectors),
          ]
        : document.vectors;

    const relevantChunks = findMostSimilarChunks(queryEmbedding, allVectors, 3);
    const context = relevantChunks.map((v) => v.content).join("\n\n");

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
        { role: "user", content: prompt },
      ],
    });

    const assistantReply =
      chatResponse.choices?.[0]?.message?.content || "I'm not sure.";
    // Save the assistant's reply
    await prisma.message.create({
      data: {
        content: assistantReply,
        role: "assistant",
        chatId: chatId,
      },
    });
    return NextResponse.json({ response: assistantReply });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}

function findMostSimilarChunks(
  queryEmbedding: number[],
  vectors: any[],
  count: number
) {
  const vectorsWithSimilarity = vectors.map((vector) => {
    const similarity = calculateCosineSimilarity(
      queryEmbedding,
      vector.embedding
    );
    return { ...vector, similarity };
  });
  return vectorsWithSimilarity
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, count);
}

function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  return normA && normB ? dotProduct / (normA * normB) : 0;
}
