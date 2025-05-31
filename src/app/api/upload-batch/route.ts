import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Client } from "minio";
import { extractTextContent, extractTitle } from "../urls/route";
type UploadWebPageOptions = {
  url: string;
  userId: string;
  baseUrl: string;
};

type UploadDocumentOptions = {
  file: File;
  userId: string;
  baseUrl: string;
};
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

    const files = formData.getAll("files") as File[];
    const fileIds = formData.getAll("fileIds") as string[];
    const urlsRaw = formData.get("urls") as string;
    const name = formData.get("name") as string;
    const type = (formData.get("type") as string)?.toLowerCase(); // 'document', 'url', or 'both'
    if (!type || !["document", "url", "both"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid resource type" },
        { status: 400 }
      );
    }

    // check name and type
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Resource name is required" },
        { status: 400 }
      );
    }

    const baseUrl = request.nextUrl.origin;

    const urls = urlsRaw ? JSON.parse(urlsRaw) : [];

    const resultMap: Record<string, string> = {};

    if (type === "document" || type === "both") {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const resourceId = fileIds[i];

        const result = await uploadDocument({
          file,
          userId,
          baseUrl,
        });

        if (result.success && result.documentId) {
          resultMap[resourceId] = result.documentId;
        } else {
          console.error(
            `Failed to upload document for resource ${resourceId}:`,
            result.error
          );
        }
      }
    }

    if (type === "url" || type === "both") {
      for (const urlData of urls) {
        const { id: resourceId, url } = urlData;

        const result = await uploadWebPage({
          url,
          userId,
          baseUrl,
        });

        if (result.success && result.webPageId) {
          resultMap[resourceId] = result.webPageId;
        } else {
          console.error(
            `Failed to upload webpage for resource ${resourceId}:`,
            result.error
          );
        }
      }
    }

    // create a resource entry in the database
    await prisma.batchResource.create({
      data: {
        name,
        type,
        userId,
        totalFiles: files.length + urls.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Resources processed successfully",
      ids: resultMap,
    });
  } catch (error) {
    console.error("Error processing upload-batch:", error);
    return NextResponse.json(
      { error: "Failed to process resources" },
      { status: 500 }
    );
  }
}

// let create supposing functions for file storage, etc.

export async function uploadDocument({
  file,
  userId,
  baseUrl,
}: UploadDocumentOptions): Promise<{
  success: boolean;
  documentId?: string;
  error?: string;
}> {
  try {
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: "File size exceeds 10MB limit" };
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
      7 * 24 * 60 * 60 // 7 days
    );

    // Save document metadata to DB
    const document = await prisma.document.create({
      data: {
        title: file.name,
        fileUrl: presignedUrl,
        fileType: file.type,
        fileSize: file.size,
        userId,
      },
    });

    // Optional: Trigger vectorization
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

    return { success: true, documentId: document.id };
  } catch (error) {
    console.error("Error uploading document:", error);
    return { success: false, error: "Failed to upload file" };
  }
}

export async function uploadWebPage({
  url,
  userId,
  baseUrl,
}: UploadWebPageOptions): Promise<{
  success: boolean;
  webPageId?: string;
  error?: string;
}> {
  try {
    if (!url) {
      return { success: false, error: "URL is required" };
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return { success: false, error: "Invalid URL format" };
    }

    // Fetch web page
    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, error: "Failed to fetch web page" };
    }

    const html = await response.text();
    const title = extractTitle(html) || url;
    const content = extractTextContent(html);

    // Store metadata
    const webPage = await prisma.webPage.create({
      data: {
        url,
        title,
        userId,
      },
    });

    // Optionally: Call vectorize API
    fetch(`${baseUrl}/api/vectorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: webPage.id,
        type: "webpage",
        content,
        userId,
      }),
    });

    return { success: true, webPageId: webPage.id };
  } catch (error) {
    console.error("Error uploading webpage:", error);
    return { success: false, error: "Failed to process URL" };
  }
}
