import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    // todo:(Change the process)
    const uploadsDir = join(process.cwd(), "uploads");
    try {
      await writeFile(join(uploadsDir, ".keep"), "");
    } catch (error) {
      // Directory doesn't exist, create it
      const { mkdir } = require("node:fs/promises");
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueId = Date.now().toString();
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uniqueId}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save to disk
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    // Save document metadata to database
    const document = await prisma.document.create({
      data: {
        title: file.name,
        fileUrl: filePath,
        fileType: file.type,
        fileSize: file.size,
        userId: userId,
      },
    });

    //todo: call vectorize api here

    return NextResponse.json({
      success: true,
      documentId: document.id,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
