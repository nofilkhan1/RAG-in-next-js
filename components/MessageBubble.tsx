"use client";

import { ChevronDown, ChevronUp, Copy, Check, FileText } from "lucide-react";
import { useState } from "react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: number;
}

export default function MessageBubble({ role, content, sources, timestamp }: MessageBubbleProps) {
  const [showSources, setShowSources] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeStr = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={"flex w-full gap-3 " + (role === "user" ? "flex-row-reverse" : "")}>
      <div
        className={
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center " +
          (role === "user" ? "bg-white/10" : "bg-amber-500/20")
        }
      >
        {role === "user" ? (
          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 .5h-3l-1-.5L8 17l-2.5-1.5L9.5 8.5l2.5 1.5L14 6.5l2.5 1.5L14.5 17l-2.5 1.5L9.75 17zM6 14l-1.5 1.5L3 17l2.5-1.5L3 10.5l1.5-1.5L6 14z"
            />
          </svg>
        )}
      </div>

      <div className={"flex-1 max-w-[85%] " + (role === "user" ? "text-right" : "")}>
        <div
          className={
            "inline-block px-4 py-2.5 rounded-2xl " +
            (role === "user"
              ? "bg-amber-500 text-black rounded-tr-none"
              : "bg-white/5 border border-white/10 rounded-tl-none")
          }
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>

        {sources && sources.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowSources(!showSources)}
              className={
                "flex items-center gap-1 text-xs text-white/50 hover:text-white/70 transition-colors " +
                (role === "user" ? "ml-auto" : "")
              }
              aria-expanded={showSources}
            >
              <FileText className="w-3 h-3" />
              <span>{sources.length} source{sources.length !== 1 ? "s" : ""}</span>
              {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showSources && (
              <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-lg text-left">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sources.map((source, i) => (
                    <div key={i} className="text-xs text-white/60 border-l border-white/10 pl-3">
                      <span className="text-white/40 font-mono">[Source {i + 1}]</span>
                      <p className="mt-1 whitespace-pre-wrap">{source}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className={
            "flex items-center gap-2 mt-1 text-xs text-white/30 " +
            (role === "user" ? "justify-end" : "")
          }
        >
          <time dateTime={new Date(timestamp).toISOString()}>{timeStr}</time>
          <button
            onClick={handleCopy}
            className="p-1 hover:text-white/50 transition-colors rounded"
            aria-label={copied ? "Copied!" : "Copy message"}
            title={copied ? "Copied!" : "Copy"}
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}
