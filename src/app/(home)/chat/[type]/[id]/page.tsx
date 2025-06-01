"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ChatType = "batchResource" | "document" | "webpage";

export default function ChatPage() {
  const { type, id } = useParams() as { type: ChatType; id: string };

  const [title, setTitle] = useState("");
  type Message = {
    id: string;
    role: "assistant" | "user";
    content: string;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I'm your assistant. Ask me anything.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch metadata for batch/document/webpage
  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch(`/api/${type}s/${id}`);
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        const name = data[`${type}`]?.name
          ? data[`${type}`]?.name
          : data[`${type}`]?.title;

        setTitle(name);
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `Hello! I'm your ${type} assistant. Ask me anything about "${name}".`,
          },
        ]);
      } catch (err) {
        console.error("Error fetching info:", err);
      }
    }

    if (type && id) fetchInfo();
  }, [type, id]);

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
      const res = await fetch(`/api/chat/${type}/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input,
          messages: [...messages, userMessage],
        }),
      });

      const data = await res.json();
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: data.response ?? "Sorry, no response available.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error:", err);
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
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask a question about "${title}"...`}
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
