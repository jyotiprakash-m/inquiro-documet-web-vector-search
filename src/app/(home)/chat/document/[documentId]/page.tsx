"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const params = useParams();
  const documentId = params.documentId as string;

  const [documentTitle, setDocumentTitle] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I'm your document assistant. Ask me anything about `,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch document info on mount
  useEffect(() => {
    async function fetchDocumentInfo() {
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        if (response.ok) {
          const data = await response.json();

          setDocumentTitle(data.document.title);
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: `Hello! I'm your document assistant. Ask me anything about "${data.document.title}"`,
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching document info:", error);
      }
    }

    if (documentId) {
      fetchDocumentInfo();
    }
  }, [documentId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/chat/document/${documentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input,
          messages: [...messages, userMessage],
        }),
      });

      const data = await res.json();

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: data.response || "Sorry, I couldn't generate a response.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setInput("");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
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

        {/* This empty div helps scroll to bottom */}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask a question about "${documentTitle}"...`}
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
