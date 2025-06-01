"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { Plus, Trash, Pencil } from "lucide-react";
import { ChatType } from "@/app/(home)/chat/[type]/[id]/page";
import { Chat } from "@prisma/client";
import { truncateText } from "@/lib/utils";

export default function ChatSidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const router = useRouter();
  const { type, id } = useParams() as { type: ChatType; id: string };
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;

    const fetchChats = async () => {
      try {
        hasFetchedRef.current = true; // Set before async operations

        const response = await fetch(`/api/chats?type=${type}&id=${id}`);
        // get the resource info
        const resourceInfo = await fetch(`/api/${type}s/${id}`);
        if (!resourceInfo.ok) throw new Error("Fetch failed");
        const info = await resourceInfo.json();

        const name =
          info[`${type}`]?.name || info[`${type}`]?.title || "Untitled";
        if (!response.ok) throw new Error("Failed to fetch chats");

        const data: Chat[] = await response.json();

        if (data.length === 0) {
          const newChatRes = await fetch(`/api/chats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              title: "Untitled chat",
              id,
            }),
          });

          if (!newChatRes.ok) throw new Error("Failed to create new chat");

          const newChatData = await newChatRes.json();

          if (!response.ok) throw new Error("Failed to fetch chats");
          // Store first assistant message in the new chat
          const firstMessage = {
            role: "assistant",
            content: `Hello! I'm your ${type} assistant. Ask me anything about this ${name}.`,
          };
          await fetch(`/api/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatId: newChatData.chat.id,
              ...firstMessage,
            }),
          });

          setChats([newChatData.chat]);

          router.replace(`/chat/${type}/${id}?chatId=${newChatData.chat.id}`);
        } else {
          setChats(data);
          const chat = data[0];
          router.replace(`/chat/${type}/${id}?chatId=${chat.id}`);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchChats();
  }, [type, id]);

  const createNewChat = async () => {
    try {
      const newChatRes = await fetch(`/api/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: "Untitled chat",
          id,
        }),
      });
      if (!newChatRes.ok) {
        throw new Error("Failed to create new chat");
      }

      const newChatData = await newChatRes.json();

      // Store first assistant message in the new chat
      const resourceInfo = await fetch(`/api/${type}s/${id}`);
      if (!resourceInfo.ok) throw new Error("Fetch failed");
      const info = await resourceInfo.json();

      const name =
        info[`${type}`]?.name || info[`${type}`]?.title || "Untitled";
      const firstMessage = {
        role: "assistant",
        content: `Hello! I'm your ${type} assistant. Ask me anything about this ${name}.`,
      };
      await fetch(`/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: newChatData.chat.id,
          ...firstMessage,
        }),
      });
      const response = await fetch(`/api/chats?type=${type}&id=${id}`);
      const data: Chat[] = await response.json();
      setChats(data);
      router.replace(`/chat/${type}/${id}?chatId=${newChatData.chat.id}`);
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const deleteChat = async (selectedChatId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this chat?"
    );
    if (!confirmDelete) return;

    // Find the next available chat before updating the state
    const remainingChats = chats.filter((chat) => chat.id !== selectedChatId);
    const isCurrentChat = chatId === selectedChatId;

    try {
      const res = await fetch(`/api/chats/${selectedChatId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Failed to delete chat: ${res.statusText}`);
      }
      setChats(remainingChats);

      if (isCurrentChat) {
        if (remainingChats.length > 0) {
          router.replace(`/chat/${type}/${id}?chatId=${remainingChats[0].id}`);
        } else {
          // No chats left, redirect to the base type page or fallback route
          router.replace(`/chat/${type}/${id}`);
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      // Optionally re-add the chat if deletion failed
    }

    setEditingId(null);
    setEditedTitle("");
  };

  const saveTitle = async (id: string) => {
    if (!editedTitle.trim()) {
      setEditingId(null);
      setEditedTitle("");
      return;
    }

    const updatedChats = chats.map((chat) =>
      chat.id === id ? { ...chat, title: editedTitle } : chat
    );
    setChats(updatedChats);

    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editedTitle }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update chat title: ${res.statusText}`);
      }
    } catch (error) {
      console.error("Error updating chat title:", error);
    }

    setEditingId(null);
    setEditedTitle("");
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
                className="text-left text-gray-800 flex-1"
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
                  <span className="w-full">
                    {truncateText(chat.title, 15)}{" "}
                  </span>
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
                disabled={chats.length === 1} // Disable if only one chat left
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
