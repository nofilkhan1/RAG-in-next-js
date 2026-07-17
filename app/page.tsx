"use client";

import { useState } from "react";
import UploadPanel from "@/components/UploadPanel";
import ChapterSelector from "@/components/ChapterSelector";
import ChatPanel from "@/components/ChatPanel";
import EmptyState from "@/components/EmptyState";
import { BookOpen, Menu, X, Settings } from "lucide-react";

export default function Home() {
  const [bookId, setBookId] = useState("");
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      sources?: string[];
      timestamp: number;
    }>
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (file: File, bid: string, cid: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookId", bid);
      formData.append("chapterId", cid);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setChapterId(cid);
      setMessages([]);
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async (question: string) => {
    if (!bookId || !chapterId) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: question,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, bookId, chapterId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get answer");

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: data.answer,
        sources: data.sourcesUsed > 0 ? [] : undefined,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content:
          err instanceof Error ? err.message : "Something went wrong",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChapterSelect = (cid: string) => {
    setChapterId(cid);
    setMessages([]);
  };

  const handleChapterClear = () => {
    setChapterId(null);
    setMessages([]);
  };

  const sidebarVisible = sidebarOpen;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0B0C]">
      <aside
        className={
          "fixed inset-y-0 left-0 z-50 w-80 bg-[#0B0B0C] border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 " +
          (sidebarVisible ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10 lg:hidden">
            <h2 className="font-medium text-white">Chapter RAG</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg text-white/60"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-6 lg:p-6">
            <div>
              <label
                htmlFor="book-id"
                className="block text-sm text-white/60 mb-1"
              >
                Book ID
              </label>
              <input
                id="book-id"
                type="text"
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                placeholder="e.g., physics101"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              <p className="mt-1 text-xs text-white/40">
                Unique identifier for this textbook
              </p>
            </div>

            <ChapterSelector
              bookId={bookId}
              selectedChapter={chapterId}
              onSelect={handleChapterSelect}
              onClear={handleChapterClear}
              disabled={!bookId}
            />

            <div className="border-t border-white/10 pt-6" />

            <UploadPanel
              onUpload={handleUpload}
              disabled={uploading || !bookId}
            />
          </div>

          <div className="p-4 border-t border-white/10 lg:hidden">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:border-white/20 transition-colors">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg text-white/60"
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-medium text-white">Chapter RAG</h1>
          <div className="w-10" />
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          {chapterId || messages.length > 0 ? (
            <ChatPanel
              messages={messages}
              onSend={handleAsk}
              isLoading={isLoading}
              disabled={!bookId || !chapterId}
              selectedChapter={chapterId}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </div>
  );
}
