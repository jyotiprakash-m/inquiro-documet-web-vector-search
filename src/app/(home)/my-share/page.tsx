"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Share,
  ShareAccess as PrismaShareAccess,
  Document,
  WebPage,
  BatchResource,
} from "@prisma/client";
import { Copy, ExternalLink, Loader } from "lucide-react";

// ---- Types ----

type ShareWithResource = Share & {
  document: Document | null;
  webPage: WebPage | null;
  batchResource: BatchResource | null;
};

type ShareAccessWithShare = PrismaShareAccess & {
  share: ShareWithResource;
};

type ResourceMeta = {
  title: string;
  fileUrl: string;
  originalUrl: string;
  fileSize?: number | null;
  type: "document" | "webPage" | "batchResource" | "unknown";
};

const extractResource = (share: ShareWithResource): ResourceMeta => {
  if (share.document) {
    return {
      title: share.document.title,
      fileUrl: "",
      originalUrl: `/chat/share/${share.id}`,
      fileSize: share.document.fileSize,
      type: "document",
    };
  } else if (share.webPage) {
    return {
      title: share.webPage.title || "Untitled Web Page",
      fileUrl: share.webPage.url,
      originalUrl: `/chat/share/${share.id}`,
      type: "webPage",
    };
  } else if (share.batchResource) {
    return {
      title: share.batchResource.name,
      fileUrl: "",
      originalUrl: `/chat/share/${share.id}`,
      fileSize: null,
      type: "batchResource",
    };
  }
  return {
    title: "Unknown Resource",
    fileUrl: "",
    originalUrl: "#",
    type: "unknown",
  };
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const copyToClipboard = (text: string) => {
  try {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  } catch {
    toast.error("Copy failed.");
  }
};

const MyShare = () => {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const [shares, setShares] = useState<ShareAccessWithShare[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShares = async () => {
      try {
        const res = await fetch("/api/shares/my-share");
        if (!res.ok) throw new Error("Failed to fetch shares");
        const data = await res.json();
        setShares(data);
      } catch (err) {
        toast.error("Error loading shares");
      } finally {
        setLoading(false);
      }
    };

    fetchShares();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-gray-500 flex items-center gap-2">
        <Loader className="w-4 h-4 animate-spin" /> Loading shares...
      </div>
    );
  }

  if (shares.length === 0) {
    return <div className="p-6 text-gray-400">No shares found.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Shares</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shares.map(({ id, createdAt, share }) => {
          const { title, fileUrl, fileSize, type, originalUrl } =
            extractResource(share);

          return (
            <Card
              key={id}
              className="rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition duration-300 bg-white"
            >
              <CardContent className="p-5 space-y-4 text-sm text-gray-700">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-gray-900">
                    {title}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    Type: {type}
                  </p>
                  <p className="text-xs text-gray-500">
                    Shared on: {new Date(createdAt).toLocaleString()}
                  </p>
                  {fileSize != null && (
                    <p className="text-xs text-gray-500">
                      Size: {formatFileSize(fileSize)}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-700">
                    Share URL:
                  </div>
                  <div className="relative bg-gray-50 p-3 rounded-lg text-xs border border-gray-200">
                    <div className="max-h-32 overflow-y-auto pr-10 scrollbar-hide">
                      <pre className="whitespace-pre-wrap text-blue-600">
                        {baseUrl + share.shareUrl}
                      </pre>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => copyToClipboard(baseUrl + share.shareUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline block"
                    >
                      View External Resource
                    </a>
                  )}

                  <a
                    href={baseUrl + originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition"
                    title="View the original resource"
                  >
                    Chat <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyShare;
