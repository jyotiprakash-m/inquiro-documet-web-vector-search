"use client";

import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type ChatType = "batchResource" | "document" | "webpage" | "share";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");
  const { type, id } = useParams() as { type: ChatType; id: string };

  const [title, setTitle] = useState("");
  type Message = {
    id: string;
    role: "assistant" | "user";
    content: string;
  };

  const [messages, setMessages] = useState<Message[]>([]);
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
        const name =
          data[`${type}`]?.name ||
          data[`${type}`]?.title ||
          data[`${type}`]?.webPage?.title ||
          data[`${type}`]?.document?.title ||
          data[`${type}`]?.batchResource?.name ||
          "Untitled";

        setTitle(name);

        // Get all messages from the chatId
        const chatRes = await fetch(`/api/chats/${chatId}`);
        if (!chatRes.ok) throw new Error("Failed to fetch chat messages");
        const chatData = await chatRes.json();

        const chatMessages: Message[] = chatData.chat.messages.map(
          (msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
          })
        );
        setMessages(chatMessages);
      } catch (err) {
        console.error("Error fetching info:", err);
      }
    }

    if (type && id && chatId) fetchInfo();
  }, [type, id, chatId]);

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
          chatId,
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
    <div className="flex flex-col h-full">
      <header className="mb-4 px-2">
        <h1 className="text-xl font-semibold text-gray-800 truncate">
          {title}
        </h1>
      </header>

      <section className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-thin scrollbar-thumb-violet-300 scrollbar-track-gray-100">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-lg px-5 py-3 whitespace-pre-wrap break-words
                ${
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
            <div className="max-w-[75%] rounded-lg px-5 py-3 bg-gray-200 text-gray-800">
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
      </section>

      <footer className="border-t p-4 bg-white sticky bottom-0">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask a question about "${title}"...`}
            className="flex-1 border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="lg"
            disabled={isLoading || !input.trim()}
            className={`px-5 rounded-md text-white font-semibold transition flex
              ${
                isLoading || !input.trim()
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
          >
            <Send className="h-6 w-6" /> Send
          </Button>
        </form>
      </footer>
    </div>
  );
}
