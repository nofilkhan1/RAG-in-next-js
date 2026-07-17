"use client";

import { BookOpen, Upload, ArrowUpRight } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6">
        <BookOpen className="w-8 h-8 text-white/40" />
      </div>
      <h2 className="text-xl font-medium text-white mb-2">No Chapter Loaded</h2>
      <p className="text-white/50 max-w-xs mb-6">
        Upload a textbook chapter (PDF or TXT) to start asking questions.
      </p>
      <div className="flex items-center gap-2 text-white/40 text-sm">
        <Upload className="w-5 h-5" />
        <span>Drag & drop or click to upload</span>
        <ArrowUpRight className="w-4 h-4 text-white/30" />
      </div>
    </div>
  );
}
