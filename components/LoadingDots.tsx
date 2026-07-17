'use client';

export default function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5" aria-label="Generating answer">
      <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}
