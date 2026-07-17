"use client";

import { useRef, useEffect, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import MessageBubble from "./MessageBubble";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: number;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (question: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  selectedChapter?: string | null;
}

export default function ChatPanel({
  messages,
  onSend,
  isLoading,
  disabled,
  selectedChapter,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading || disabled) return;
    onSend(text);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0B0C]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
        {messages.length === 0 && !selectedChapter && (
          <div className="flex flex-col items-center justify-center h-full text-white/30">
            <p className="text-sm">Select a chapter to start chatting</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} {...msg} />
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 .5h-3l-1-.5L8 17l-2.5-1.5L9.5 8.5l2.5 1.5L14 6.5l2.5 1.5L14.5 17l-2.5 1.5L9.75 17zM6 14l-1.5 1.5L3 17l2.5-1.5L3 10.5l1.5-1.5L6 14z"
                />
              </svg>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[85%]">
              <div className="flex gap-1 items-center h-6">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustHeight(e);
            }}
            onKeyDown={handleKeyDown}
            placeholder={selectedChapter ? "Ask a question about this chapter..." : "Select a chapter first"}
            disabled={disabled || isLoading || !selectedChapter}
            rows={1}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none max-h-[150px] min-h-[48px]"
            aria-label="Your question"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || disabled || !selectedChapter}
            className="flex-shrink-0 p-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send question"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-white/30 mt-2 text-center">
          Powered by Groq Llama 3.3 70B - Local embeddings (MiniLM)
        </p>
      </form>
    </div>
  );
}
