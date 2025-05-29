import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Client } from "minio";

const {
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_USE_SSL,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET_NAME,
} = process.env;

if (
  !MINIO_ENDPOINT ||
  !MINIO_PORT ||
  !MINIO_USE_SSL ||
  !MINIO_ACCESS_KEY ||
  !MINIO_SECRET_KEY ||
  !MINIO_BUCKET_NAME
) {
  throw new Error("Missing required MinIO environment variables");
}

const minioClient = new Client({
  endPoint: MINIO_ENDPOINT,
  port: Number.parseInt(MINIO_PORT, 10),
  useSSL: MINIO_USE_SSL === "true",
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

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

    // Generate unique object name
    const uniqueId = Date.now().toString();
    const extension = file.name.split(".").pop();
    const objectName = `${userId}/${uniqueId}.${extension}`;
    const bucketName = MINIO_BUCKET_NAME;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to MinIO
    await minioClient.putObject(bucketName as string, objectName, buffer);

    // Optionally: get a presigned URL (expires in 7 days)
    const presignedUrl = await minioClient.presignedGetObject(
      bucketName as string,
      objectName,
      7 * 24 * 60 * 60
    );

    // Save document metadata to database
    const document = await prisma.document.create({
      data: {
        title: file.name,
        fileUrl: presignedUrl,
        fileType: file.type,
        fileSize: file.size,
        userId: userId,
      },
    });

    //todo: call vectorize api here
    // get base url
    const baseUrl = request.nextUrl.origin;

    fetch(`${baseUrl}/api/vectorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: document.id,
        type: "document",
        userId,
      }),
    });

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
