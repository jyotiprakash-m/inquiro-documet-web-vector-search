import ChatSidebar from "@/components/ChatSidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex overflow-hidden bg-gradient-to-br from-gray-50 to-purple-50  h-[calc(100vh-7rem)]">
      <ChatSidebar />
      <main className="flex-1  overflow-y-auto flex flex-col">{children}</main>
    </div>
  );
}
