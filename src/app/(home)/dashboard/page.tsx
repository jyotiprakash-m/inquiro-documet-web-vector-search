"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import UrlUpload from "@/components/UrlUpload";
import DeleteResource from "@/components/DeleteResource";
import BatchUpload from "@/components/BatchUpload";
import {
  CircleArrowRight,
  Expand,
  Minimize2,
  PanelTopClose,
  Upload,
} from "lucide-react";
import { WebPage } from "@prisma/client";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Share from "@/components/Share";

interface Document {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}
interface BatchResourceMerge {
  name: string;
  id: string;
  description: string | null;
  userId: string;
  type: string;
  totalFiles: number;
  createdAt: Date;
  updatedAt: Date;
  documents?: Document[];
  webPages?: WebPage[];
}

export default function Dashboard() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [batchResources, setBatchResources] = useState<BatchResourceMerge[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [expandedResourceId, setExpandedResourceId] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function fetchDocuments() {
      try {
        // Fetch documents
        const response = await fetch("/api/documents");
        if (response.ok) {
          const data = await response.json();
          setDocuments(data.documents);
        }
        // Fetch webpages
        const webpageResponse = await fetch("/api/webpages");
        const webpageData = await webpageResponse.json();
        if (webpageResponse.ok) {
          setDocuments((prevDocs) => {
            const existingIds = new Set(prevDocs.map((doc) => doc.id));

            const newDocs = webpageData.documents
              .filter((webpage: any) => !existingIds.has(webpage.id)) // Filter out duplicates
              .map((webpage: any) => ({
                id: webpage.id,
                title: webpage.title,
                fileType: "text/html",
                fileSize: 0, // URLs don't have a file size
                createdAt: webpage.createdAt,
              }));

            return [...prevDocs, ...newDocs];
          });
        }

        // Fetch batch resources
        const batchResponse = await fetch("/api/batchResources");
        if (batchResponse.ok) {
          const batchData = await batchResponse.json();
          setBatchResources(batchData.batchResources);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, []);
  const toggleExpand = (id: string) => {
    setExpandedResourceId((prev) => (prev === id ? null : id));
  };
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("doc")) return "📝";
    if (fileType.includes("text")) return "🌐";
    return "📁";
  };

  const handleDocumentClick = (documentId: string, type: string) => {
    router.push(`/chat/${type}/${documentId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold ">Your Documents / URL</h1>
        <div className="space-x-2">
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {showUpload ? (
              <span className="flex items-center gap-2">
                <Minimize2 className="w-4 h-4" />
                Document
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Document
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowUrl(!showUrl)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {showUrl ? (
              <span className="flex items-center gap-2">
                <Minimize2 className="w-4 h-4" />
                URL
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                URL
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowBatchUpload(!showBatchUpload)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {showBatchUpload ? (
              <span className="flex items-center gap-2">
                <Minimize2 className="w-4 h-4" />
                Batch
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Batch
              </span>
            )}
          </button>
        </div>
      </div>

      {showUpload && (
        <div className="mb-6">
          <FileUpload />
        </div>
      )}
      {showUrl && (
        <div className="mb-6">
          <UrlUpload />
        </div>
      )}
      {showBatchUpload && <BatchUpload />}

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-2 text-gray-500">Loading documents...</p>
        </div>
      ) : documents.length === 0 && batchResources.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500 py-10">
            No documents uploaded yet. Upload your first document to get
            started.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {documents.length > 0 && (
            <div className="px-4 pt-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Individual Resources
              </h2>
              <Separator />
            </div>
          )}
          <ul className="divide-y divide-gray-200 mt-2">
            {documents.map((doc) => {
              const isUrl = doc.fileType === "text/html";
              const type = isUrl ? "webpage" : "document";

              return (
                <li
                  key={doc.id}
                  className=" p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleDocumentClick(doc.id, type)}
                  onKeyUp={(event) => {
                    if (event.key === "Enter") {
                      handleDocumentClick(doc.id, type);
                    }
                  }}
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="text-2xl">{getFileIcon(doc.fileType)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(doc.fileSize)} •{" "}
                        {new Date(doc.createdAt).toLocaleDateString()},{" "}
                        {new Date(doc.createdAt).toLocaleTimeString()} •{" "}
                        {isUrl ? "Webpage" : doc.fileType}
                      </p>
                    </div>
                    <CircleArrowRight className="w-4 h-4 text-gray-500" />
                  </div>

                  <div className="flex items-center space-x-2 w-full justify-end mt-2">
                    <div onClick={(e) => e.stopPropagation()}>
                      <DeleteResource
                        id={doc.id}
                        title={doc.title}
                        type={type === "webpage" ? "webpages" : "documents"}
                      />
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Share type={type} resourceId={doc.id} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {batchResources.length > 0 && (
            <div className="mt-6">
              {batchResources.length > 0 && (
                <div className="px-4 pt-3 pb-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Batch Resources
                  </h2>
                  <Separator />
                </div>
              )}
              <ul className="divide-y divide-gray-200">
                {batchResources.map((resource) => (
                  <li
                    key={resource.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() =>
                        router.push(`/chat/batchResource/${resource.id}`)
                      }
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">📂</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {resource.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(resource.createdAt).toLocaleDateString()},{" "}
                            {new Date(resource.createdAt).toLocaleTimeString()}{" "}
                            •{" "}
                            {resource.type === "document"
                              ? "Document"
                              : resource.type === "webpage"
                              ? "Webpage"
                              : "Mixed"}{" "}
                            • {resource.totalFiles} Resources
                          </p>
                        </div>
                      </div>
                      <CircleArrowRight className="w-4 h-4 text-gray-500 " />
                    </div>

                    <div className="flex justify-end items-center mt-2 space-x-2 z-10">
                      <Button
                        variant="ghost"
                        onClick={() => toggleExpand(resource.id)}
                      >
                        {expandedResourceId === resource.id ? (
                          <PanelTopClose className="h-4 w-4" />
                        ) : (
                          <Expand className="w-4 h-4" />
                        )}
                      </Button>
                      <DeleteResource
                        id={resource.id}
                        title={resource.name}
                        type="batchResources"
                      />
                      <Share type="batchResource" resourceId={resource.id} />
                    </div>

                    {expandedResourceId === resource.id && (
                      <div className="bg-gray-50 w-full px-6 py-4 text-sm text-gray-700 mt-2 rounded-md">
                        {(resource.documents ?? []).length > 0 && (
                          <div className="mb-4">
                            <p className="font-semibold mb-2">Documents</p>
                            <ul className="list-disc ml-5 space-y-1">
                              {resource?.documents?.map((doc) => (
                                <li key={doc.id}>
                                  <span className="font-medium">
                                    {doc.title}
                                  </span>{" "}
                                  • {doc.fileType} •{" "}
                                  {Math.round(doc.fileSize / 1024)} KB
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {(resource.webPages ?? []).length > 0 && (
                          <div>
                            <p className="font-semibold mb-2">Web Pages</p>
                            <ul className="list-disc ml-5 space-y-1">
                              {resource?.webPages?.map((page) => (
                                <li key={page.id}>
                                  <a
                                    href={page.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    {page.title || page.url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {(resource?.documents?.length ?? 0) === 0 &&
                          (resource?.webPages?.length ?? 0) === 0 && (
                            <p className="text-gray-500">No items available.</p>
                          )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
