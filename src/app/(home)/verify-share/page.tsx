"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Share } from "@prisma/client";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

type ShareWithResource = Share & {
  document?: {
    title: string;
    fileType: string;
    fileSize: number;
  };
  webPage?: {
    title: string;
    url: string;
  };
  batchResource?: {
    name: string;
    totalFiles: number;
  };
};

const VerifyShare = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [share, setShare] = useState<ShareWithResource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShare = async () => {
      if (!token) {
        toast.error("Missing token in URL");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/shares/${token}`);
        if (!res.ok) throw new Error("Invalid or expired share token");

        const data = await res.json();
        setShare(data.share);
      } catch (err) {
        console.error(err);
        toast.error("Verification failed. Please check the link.");
      } finally {
        setLoading(false);
      }
    };

    fetchShare();
  }, [token]);

  if (loading) {
    return <div className="p-6 text-gray-600">Verifying...</div>;
  }

  if (!share) {
    return (
      <div className="p-6 text-red-500">Invalid share or token expired.</div>
    );
  }

  const {
    type,
    originalUrl,
    allocatedCounts,
    createdAt,
    document,
    webPage,
    batchResource,
    shareBy,
    id,
  } = share;

  let resource: any = null;
  if (type === "document") resource = document;
  else if (type === "webPage") resource = webPage;
  else if (type === "batchResource") resource = batchResource;

  const getResource = async () => {
    try {
      const res = await fetch(`/api/shares/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareBy,
          id,
        }),
      });
      toast.success("Successfully Get the document Eviled");
    } catch (error) {
      console.log("Error during getting resource");
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-white to-blue-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Verified Share</h1>
      <Card className="rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition duration-300 bg-white max-w-3xl mx-auto">
        <CardContent className="p-5 space-y-4 text-sm text-gray-700">
          <div className="text-gray-500 text-xs uppercase tracking-wide">
            Type: <span className="text-gray-900 font-semibold">{type}</span>
          </div>

          {resource ? (
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
                    <strong>Size:</strong> {formatFileSize(resource.fileSize)}
                  </div>
                </>
              )}

              {type === "webPage" && (
                <>
                  <div>
                    <strong>Title:</strong> {resource.title}
                  </div>
                  <div>
                    <strong>URL:</strong>{" "}
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline break-words"
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
          ) : (
            <div className="italic text-gray-500">
              Resource details not available.
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

          <div className="text-xs text-gray-600 pt-2 border-t mt-3 flex justify-between">
            <span>
              <strong>Allocated:</strong> {allocatedCounts}
            </span>
            <span>
              <strong>Created:</strong> {new Date(createdAt).toLocaleString()}
            </span>
          </div>

          <div className="mt-6 text-center">
            <Button
              onClick={getResource}
              variant="outline"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-md transition"
            >
              Get Resource
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyShare;
