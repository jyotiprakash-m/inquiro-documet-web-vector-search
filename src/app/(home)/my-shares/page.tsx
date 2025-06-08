"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy } from "lucide-react";

type Share = {
  id: string;
  type: "document" | "webPage" | "batchResource";
  originalUrl: string;
  shareUrl: string;
  shareBy: string;
  allocatedCounts: number;
  createdAt: string;
  batchResourceId?: string;
  webPageId?: string;
  documentId?: string;
};

type ShareWithResource = Share & {
  resource: any;
};

const MySharePage = () => {
  const [shares, setShares] = useState<ShareWithResource[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    const loadSharesWithResources = async () => {
      try {
        const res = await fetch("/api/shares");
        if (!res.ok) throw new Error("Failed to load shares");
        const data: Share[] = await res.json();

        const getResourceId = (share: Share) => {
          switch (share.type) {
            case "batchResource":
              return share.batchResourceId;
            case "document":
              return share.documentId;
            case "webPage":
              return share.webPageId;
            default:
              return null;
          }
        };

        const enrichedShares: ShareWithResource[] = await Promise.all(
          data.map(async (share) => {
            const resourceId = getResourceId(share);
            if (!resourceId) return { ...share, resource: null };

            try {
              const resourceRes = await fetch(
                `/api/${share.type}s/${resourceId}`
              );
              if (!resourceRes.ok) throw new Error("Resource fetch failed");

              const resourceData = await resourceRes.json();
              return {
                ...share,
                resource:
                  resourceData.batchResource ||
                  resourceData.document ||
                  resourceData.webPage ||
                  null,
              };
            } catch (err) {
              console.warn(
                `Error loading ${share.type} for share ${share.id}:`,
                err
              );
              return { ...share, resource: null };
            }
          })
        );

        setShares(enrichedShares);
      } catch (err) {
        console.error("Error loading shares:", err);
        toast.error("Failed to load shares.");
      } finally {
        setLoading(false);
      }
    };

    loadSharesWithResources();
  }, []);

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

  if (loading) {
    return <div className="p-6 text-gray-600">Loading...</div>;
  }

  return (
    <div className="p-4 sm:p-6 ">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800">My Shares</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shares.map(
          ({
            id,
            type,
            originalUrl,
            shareUrl,
            allocatedCounts,
            createdAt,
            resource,
          }) => (
            <Card
              key={id}
              className="rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition duration-300 bg-white"
            >
              <CardContent className="p-5 space-y-4 text-sm text-gray-700">
                <div className="text-gray-500 text-xs uppercase tracking-wide">
                  Type:{" "}
                  <span className="text-gray-900 font-semibold">{type}</span>
                </div>

                {resource && (
                  <div className="space-y-1">
                    {type === "document" && (
                      <>
                        <div>
                          <strong>Title:</strong> {resource.title}
                        </div>
                        <div>
                          <strong>File Type:</strong> {resource.fileType}
                        </div>
                        <div>
                          <strong>Size:</strong>{" "}
                          {formatFileSize(resource.fileSize)}
                        </div>
                      </>
                    )}
                    {type === "webPage" && (
                      <>
                        <div>
                          <strong>Title:</strong> {resource.title}
                        </div>
                        <div className="break-words">
                          <strong>URL:</strong>{" "}
                          <a
                            href={resource.url}
                            className="text-blue-600 underline"
                            target="_blank"
                          >
                            {resource.url}
                          </a>
                        </div>
                      </>
                    )}
                    {type === "batchResource" && (
                      <>
                        <div>
                          <strong>Name:</strong> {resource.name}
                        </div>
                        <div>
                          <strong>Total Files:</strong> {resource.totalFiles}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="break-words text-sm">
                  <strong>Original URL:</strong>{" "}
                  <a
                    href={originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {originalUrl}
                  </a>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-700">
                    Share URL:
                  </div>
                  <div className="relative bg-gray-50 p-3 rounded-lg text-xs border border-gray-200">
                    <div className="max-h-32 overflow-y-auto pr-10 scrollbar-hide">
                      <pre className="whitespace-pre-wrap text-blue-600">
                        {baseUrl + shareUrl}
                      </pre>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -top-4 -right-4 text-xs"
                      onClick={() => copyToClipboard(baseUrl + shareUrl)}
                    >
                      <Copy />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t mt-3">
                  <span>
                    <strong>Allocated:</strong> {allocatedCounts}
                  </span>
                  <span>
                    <strong>Created:</strong>{" "}
                    {new Date(createdAt).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
};

export default MySharePage;
