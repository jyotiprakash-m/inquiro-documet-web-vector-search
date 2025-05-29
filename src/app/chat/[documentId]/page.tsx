"use client";

import { useState } from "react";
import { useChat } from "ai/react";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const { documentId } = useParams();
  const [documentTitle, setDocumentTitle] = useState("Document");

  // Fetch document title on component mount
  useState(() => {
    async function fetchDocumentInfo() {
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        if (response.ok) {
          const data = await response.json();
          setDocumentTitle(data.document.title);
        }
      } catch (error) {
        console.error("Error fetching document info:", error);
      }
    }

    fetchDocumentInfo();
  });

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: `/api/chat/${documentId}`,
      initialMessages: [
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm your document assistant. Ask me anything about "${documentTitle}".`,
        },
      ],
    });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-200 text-gray-800">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" />
                <div
                  className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question about your document..."
            className="flex-1 border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`px-4 py-2 rounded-md text-white ${
              isLoading || !input.trim()
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
