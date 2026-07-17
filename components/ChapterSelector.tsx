"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface ChapterSelectorProps {
  bookId: string;
  selectedChapter: string | null;
  onSelect: (chapterId: string) => void;
  onClear: () => void;
  disabled?: boolean;
  refreshKey?: number;
}

export default function ChapterSelector({
  bookId,
  selectedChapter,
  onSelect,
  onClear,
  disabled,
  refreshKey,
}: ChapterSelectorProps) {
  const [chapters, setChapters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId.trim()) {
      setChapters([]);
      return;
    }
    fetchChapters();
  }, [bookId, refreshKey]);

  const fetchChapters = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chapters?bookId=" + encodeURIComponent(bookId));
      if (!res.ok) throw new Error("Failed to load chapters");
      const data = await res.json();
      setChapters(data.chapters || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chapters");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      <label htmlFor="chapter-select" className="block text-xs text-white/50 mb-1">
        Chapter
      </label>
      <div className="relative">
        <select
          id="chapter-select"
          value={selectedChapter || ""}
          onChange={(e) => onSelect(e.target.value)}
          disabled={disabled || loading || chapters.length === 0}
          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 appearance-none pr-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select a chapter...</option>
          {chapters.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </div>
      </div>

      {selectedChapter && (
        <button
          onClick={onClear}
          disabled={disabled}
          className="mt-2 w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:border-white/20 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear selection
        </button>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400" role="alert">{error}</p>
      )}

      {chapters.length === 0 && bookId.trim() && !loading && (
        <p className="mt-2 text-xs text-white/40">No chapters found for this book ID</p>
      )}
    </div>
  );
}
