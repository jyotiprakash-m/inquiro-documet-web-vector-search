"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { Plus, Trash, Pencil } from "lucide-react";
import { ChatType } from "@/app/(home)/chat/[type]/[id]/page";

type ChatSession = {
  id: string;
  title: string;
  type: "webpage" | "document" | "batchResource";
  relatedId: string;
  createdAt: string;
};

export default function ChatSidebar() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const router = useRouter();
  const { type, id } = useParams() as { type: ChatType; id: string };
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");

  useEffect(() => {
    const saved = localStorage.getItem("chatSessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setChats(parsed);
      } catch {
        localStorage.removeItem("chatSessions");
      }
    }
  }, []);

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: crypto.randomUUID(),
      title: "Untitled Chat",
      type: type,
      relatedId: id,
      createdAt: new Date().toISOString(),
    };
    const updated = [newChat, ...chats];
    setChats(updated);
    localStorage.setItem("chatSessions", JSON.stringify(updated));
    router.push(`/chat/${type}/${id}?chatId=${newChat.id}`);
  };

  const deleteChat = (id: string) => {
    const filtered = chats.filter((chat) => chat.id !== id);
    setChats(filtered);
    localStorage.setItem("chatSessions", JSON.stringify(filtered));
  };

  const saveTitle = (id: string) => {
    if (!editedTitle.trim()) return;
    const updated = chats.map((chat) =>
      chat.id === id ? { ...chat, title: editedTitle.trim() } : chat
    );
    setChats(updated);
    localStorage.setItem("chatSessions", JSON.stringify(updated));
    setEditingId(null);
  };

  return (
    <aside className="flex flex-col w-72 bg-white border-r shadow-sm h-full sticky top-0">
      <div className="p-4 border-b flex items-center justify-center">
        <Button
          onClick={createNewChat}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-md transition"
        >
          <Plus className="mr-2 w-4 h-4" /> New Chat
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-violet-300 scrollbar-track-gray-100 p-3 space-y-2">
        {chats.length === 0 && (
          <p className="text-center text-gray-500 mt-6">No chats yet</p>
        )}
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`flex items-center justify-between p-3 rounded-lg transition gap-0.5 ${
              chat.id === chatId
                ? "bg-violet-200 font-semibold"
                : "bg-gray-100 hover:bg-violet-100"
            }`}
          >
            <div>
              <Link
                href={`/chat/${type}/${id}?chatId=${chat.id}`}
                className="truncate text-left text-gray-800 flex-1"
                title={chat.title}
              >
                {editingId === chat.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveTitle(chat.id);
                    }}
                    className="w-full"
                  >
                    <input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      autoFocus
                      onBlur={() => saveTitle(chat.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setEditingId(null);
                          setEditedTitle("");
                        }
                      }}
                      className="w-full bg-white px-1 py-0.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </form>
                ) : (
                  chat.title
                )}
              </Link>
            </div>
            <div className="flex items-center">
              <Button
                onClick={() => {
                  setEditingId(chat.id);
                  setEditedTitle(chat.title);
                }}
                variant="ghost"
                className="p-1 text-gray-500 hover:text-blue-600"
                size="icon"
                title="Edit title"
                aria-label="Edit title"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => deleteChat(chat.id)}
                variant="ghost"
                className=" p-1 text-gray-500 hover:text-red-600 focus:outline-none"
                size="icon"
                aria-label={`Delete chat ${chat.title}`}
                title="Delete chat"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
