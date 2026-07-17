"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface UploadPanelProps {
  onUpload: (file: File, bookId: string, chapterId: string) => Promise<void>;
  disabled?: boolean;
}

export default function UploadPanel({ onUpload, disabled }: UploadPanelProps) {
  const [bookId, setBookId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((f: File): string | null => {
    if (f.size > 10 * 1024 * 1024) return "File must be under 10MB";
    const validTypes = ["application/pdf", "text/plain"];
    if (!validTypes.includes(f.type)) {
      return "Only PDF and TXT files are supported";
    }
    return null;
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setFile(f);
    setError("");
    if (!chapterId) {
      const name = f.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]/g, "-");
      setChapterId(name);
    }
  }, [chapterId, validateFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !bookId.trim() || !chapterId.trim() || disabled) return;

    setStatus("uploading");
    setError("");

    try {
      await onUpload(file, bookId.trim(), chapterId.trim());
      setStatus("success");
      setFile(null);
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-white/10 rounded-lg bg-white/5">
      <h3 className="font-medium text-white flex items-center gap-2">
        <Upload className="w-5 h-5 text-white/60" />
        Upload Chapter
      </h3>

      <div>
        <label htmlFor="ubookId" className="block text-sm text-white/60 mb-1">
          Book ID
        </label>
        <input
          id="ubookId"
          type="text"
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
          placeholder="e.g., physics101"
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-white/30"
          disabled={disabled || status === "uploading"}
          required
        />
      </div>

      <div>
        <label htmlFor="uchapterId" className="block text-sm text-white/60 mb-1">
          Chapter ID
        </label>
        <input
          id="uchapterId"
          type="text"
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
          placeholder="e.g., chapter-1"
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-white/30"
          disabled={disabled || status === "uploading"}
          required
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-1">File (PDF or TXT)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileChange}
          className="sr-only"
          id="file-upload"
          disabled={disabled || status === "uploading"}
        />
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={disabled || status === "uploading"}
          className="w-full px-3 py-3 border-2 border-dashed border-white/10 rounded-lg hover:border-amber-400/50 transition-colors flex items-center justify-center gap-2 text-white/60"
        >
          <FileText className="w-5 h-5" />
          <span>{file ? file.name : "Click to select or drag & drop"}</span>
        </button>
        {file && (
          <p className="mt-1 text-xs text-white/40">
            {(file.type === "application/pdf" ? "PDF" : "Text") + " - " + (file.size / 1024).toFixed(1) + " KB"}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {status === "success" && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Chapter indexed successfully!</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!file || !bookId.trim() || !chapterId.trim() || disabled || status === "uploading"}
        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === "uploading" && <Loader2 className="w-4 h-4 animate-spin" />}
        {status === "uploading" ? "Indexing..." : "Index Chapter"}
      </button>
    </form>
  );
}
