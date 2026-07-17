"use client";

import { useState, useRef } from "react";
import { Search, Loader2, FileText, X } from "lucide-react";

interface SearchResult {
  text: string;
  chapterId: string;
  chunkIndex: number;
  score?: number;
}

interface SearchPanelProps {
  bookId: string;
  disabled?: boolean;
}

export default function SearchPanel({ bookId, disabled }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading || !bookId) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, bookId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");

      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="relative">
        <label htmlFor="search-query" className="block text-xs text-white/50 mb-1">
          Search Book Content
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all chapters..."
            disabled={disabled || loading || !bookId}
            className="w-full px-4 py-2.5 pr-20 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 hover:bg-white/10 rounded text-white/40 hover:text-white/60 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={!query.trim() || loading || !bookId}
              className="p-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Search"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <p className="text-xs text-red-400" role="alert">{error}</p>
      )}

      {searched && !loading && !error && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-xs text-white/40 text-center py-4">
              No matching content found
            </p>
          ) : (
            results.map((r, i) => (
              <div
                key={i}
                className="p-2.5 bg-white/5 border border-white/10 rounded-lg"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span className="text-xs text-amber-400 font-mono">{r.chapterId}</span>
                  {r.score !== undefined && (
                    <span className="text-xs text-white/30 ml-auto">
                      {(r.score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/60 leading-relaxed line-clamp-3">
                  {r.text}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
