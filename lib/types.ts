// Shared TypeScript types and Zod validation schemas

import { z } from 'zod';

/** Embedding model configuration */
export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
export const EMBEDDING_DIM = 384;

/** LanceDB configuration */
export const LANCE_DB_PATH = './storage';
export const COLLECTION_NAME = 'chapters';

/** Retrieval configuration */
export const TOP_K = 4;

/** Chunking configuration */
export const CHUNK_TARGET_WORDS = 400;
export const CHUNK_OVERLAP_WORDS = 50;

/** Groq model configuration */
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_TEMPERATURE = 0.1;
export const GROQ_MAX_TOKENS = 2048;

// ============================================================
// Zod Schemas for API validation
// ============================================================

/** Upload API request schema */
export const uploadSchema = z.object({
  bookId: z.string().min(1, 'bookId is required'),
  chapterId: z.string().min(1, 'chapterId is required'),
});

/** Ask API request schema */
export const askSchema = z.object({
  question: z.string().min(1, 'Question is required').max(2000),
  bookId: z.string().min(1, 'bookId is required'),
  chapterId: z.string().min(1, 'chapterId is required'),
});

/** Chapters API query schema */
export const chaptersQuerySchema = z.object({
  bookId: z.string().min(1, 'bookId is required'),
});

// Inferred types from schemas
export type UploadRequest = z.infer<typeof uploadSchema>;
export type AskRequest = z.infer<typeof askSchema>;
export type ChaptersQuery = z.infer<typeof chaptersQuerySchema>;

// ============================================================
// Core Types
// ============================================================

/** Text chunk stored in vector database */
export interface Chunk {
  id: string;
  text: string;
  bookId: string;
  chapterId: string;
  chunkIndex: number;
  vector: number[];
}

/** Chapter metadata */
export interface ChapterInfo {
  bookId: string;
  chapterId: string;
  chunkCount: number;
}

/** Embedding result */
export interface EmbeddingResult {
  embeddings: number[][];
  dim: number;
}

/** Upload API response */
export interface UploadResponse {
  status: 'indexed';
  bookId: string;
  chapterId: string;
  numChunks: number;
}

/** Ask API response */
export interface AskResponse {
  answer: string;
  sourcesUsed: number;
  sources?: string[];
}

/** Search API request schema */
export const searchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(2000),
  bookId: z.string().min(1, 'bookId is required'),
});

export type SearchRequest = z.infer<typeof searchSchema>;

/** Search API response */
export interface SearchResponse {
  results: Array<{
    text: string;
    chapterId: string;
    chunkIndex: number;
    score?: number;
  }>;
}

/** Chapters API response */
export interface ChaptersResponse {
  chapters: string[];
}

/** API error response */
export interface ApiError {
  error: string;
}
export type ErrorResponse = ApiError;

/** Message in chat history */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp: number;
}
