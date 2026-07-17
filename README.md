# Chapter RAG

A chapter-scoped Retrieval-Augmented Generation app built with Next.js. Upload textbook chapters (PDF/TXT), then ask grounded questions about them. Embeddings run **locally** (MiniLM via Xenova Transformers); answer generation uses **Groq's Llama 3.3 70B**.

## Architecture

```
Upload: PDF/TXT → extract text → clean → chunk → embed (local MiniLM) → LanceDB
Ask:    question → embed → vector search (filtered by bookId + chapterId) → top-k chunks → Groq Llama 3.3 70B → grounded answer
```

## Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com/keys)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Set your Groq API key
echo "GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx" > .env.local

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. **Enter a Book ID** (e.g., `physics101`) in the sidebar
2. **Upload a chapter** — select a PDF or TXT file, enter a Chapter ID (e.g., `chapter-1`), and click "Index Chapter"
3. **Select the chapter** from the dropdown to load it
4. **Ask questions** about the chapter content in the chat panel

The first request after starting the server will be slower (~5–10s) while the MiniLM embedding model loads into memory. Subsequent requests are fast.

## API

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/upload` | Upload and index a chapter (multipart/form-data: file, bookId, chapterId) |
| POST | `/api/ask` | Ask a question (JSON: question, bookId, chapterId) |
| GET | `/api/chapters?bookId=` | List indexed chapters for a book |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React + Tailwind CSS |
| Embeddings | Xenova/all-MiniLM-L6-v2 (local, ONNX) |
| Vector DB | LanceDB (embedded, file-based) |
| LLM | Groq Llama 3.3 70B (versatile) |
| Validation | Zod |
| PDF parsing | pdf-parse |

## Project Structure

```
app/
├── layout.tsx          # Root layout + error boundary
├── page.tsx            # Main UI (sidebar + chat)
├── globals.css         # Design tokens + Tailwind
└── api/
    ├── upload/route.ts # POST — index a chapter
    ├── ask/route.ts    # POST — answer a question
    └── chapters/route.ts # GET — list chapters
lib/
├── types.ts            # Shared types + Zod schemas
├── pdf.ts              # PDF text extraction
├── chunking.ts         # Paragraph-aware text chunking
├── embeddings.ts       # MiniLM embedding (lazy singleton)
├── vectorstore.ts      # LanceDB operations
└── generate.ts         # Groq prompt + answer generation
components/
├── UploadPanel.tsx     # File upload form
├── ChapterSelector.tsx # Chapter dropdown
├── ChatPanel.tsx       # Chat message list + input
├── MessageBubble.tsx   # Single message with copy/sources
├── EmptyState.tsx      # Initial placeholder
├── Toast.tsx           # Global toast notifications
└── ErrorBoundary.tsx   # Render error boundary
```

## Known Limitations

- Scanned/image-only PDFs are rejected (no OCR)
- No authentication — anyone reaching the server can upload/query
- Text chunking uses word-count targets, not true token counting
- Cold start loads MiniLM ONNX model into memory (~5–10s)
