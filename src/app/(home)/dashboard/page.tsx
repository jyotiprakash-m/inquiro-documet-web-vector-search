"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import UrlUpload from "@/components/UrlUpload";

interface Document {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch("/api/documents");
        if (response.ok) {
          const data = await response.json();
          setDocuments(data.documents);
        }
        // get urls
        const urlResponse = await fetch("/api/urls");
        const urlData = await urlResponse.json();
        if (urlResponse.ok) {
          setDocuments((prevDocs) => [
            ...prevDocs,
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            ...urlData.documents.map((url: any) => ({
              id: url.id,
              title: url.title,
              fileType: "text/html",
              fileSize: 0, // URLs don't have a file size
              createdAt: url.createdAt,
            })),
          ]);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("doc")) return "📝";
    if (fileType.includes("text")) return "📃";
    return "📁";
  };

  const handleDocumentClick = (documentId: string, type: string) => {
    router.push(`/chat/${type}/${documentId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Documents/URL</h1>
        <div className="space-x-2">
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {showUpload ? "Hide Upload" : "Upload Document"}
          </button>
          <button
            type="button"
            onClick={() => setShowUrl(!showUrl)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {showUrl ? "Hide Url" : "Upload URL"}
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

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-2 text-gray-500">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500 py-10">
            No documents uploaded yet. Upload your first document to get
            started.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {documents.map((doc) => {
              const isUrl = doc.fileType === "text/html";
              const type = isUrl ? "webpage" : "document";
              return (
                <li
                  key={doc.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleDocumentClick(doc.id, type)}
                  onKeyUp={(event) => {
                    if (event.key === "Enter") {
                      handleDocumentClick(doc.id, type);
                    }
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getFileIcon(doc.fileType)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(doc.fileSize)} •{" "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
