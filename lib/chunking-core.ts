// Core text chunking logic - paragraph-aware chunking

import { CHUNK_TARGET_WORDS, CHUNK_OVERLAP_WORDS } from './types';

/**
 * Clean raw text: normalize whitespace, remove excessive newlines
 */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Count words in a string
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Split text into paragraphs (separated by double newlines)
 */
function splitParagraphs(text: string): string[] {
  return text.split('\n\n').map(p => p.trim()).filter(Boolean);
}

/**
 * Pack paragraphs into chunks of ~targetWords with overlap
 */
function packParagraphs(paragraphs: string[], targetWords: number, overlapWords: number): string[] {
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const paraWords = countWords(para);
    
    // If a single paragraph exceeds target, split it by word window
    if (paraWords > targetWords) {
      // Flush current chunk first
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
        currentChunk = [];
        currentWordCount = 0;
      }
      // Split oversized paragraph using word window
      const words = para.split(/\s+/);
      for (let i = 0; i < words.length; i += targetWords - overlapWords) {
        const window = words.slice(i, i + targetWords).join(' ');
        if (window.trim()) {
          chunks.push(window);
        }
      }
      continue;
    }

    // If adding this paragraph exceeds target, flush current chunk
    if (currentWordCount + paraWords > targetWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
      // Start new chunk with overlap from previous chunk
      const prevFullText = currentChunk.join('\n\n');
      const prevWords = prevFullText.split(/\s+/);
      const overlapTokenStr = prevWords.slice(-overlapWords).join(' ');
      currentChunk = overlapTokenStr ? [overlapTokenStr, para] : [para];
      currentWordCount = countWords(currentChunk.join('\n\n'));
    } else {
      currentChunk.push(para);
      currentWordCount += paraWords;
    }
  }

  // Flush remaining
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  return chunks;
}

/**
 * Paragraph-aware text chunking:
 * - Split on double newlines first
 * - Pack paragraphs into ~400 word groups with 50 word overlap
 * - Fall back to word-window splitting for oversized paragraphs
 */
export function chunkText(text: string): string[] {
  const cleaned = cleanText(text);
  const paragraphs = splitParagraphs(cleaned);
  
  if (paragraphs.length === 0) {
    return [];
  }

  return packParagraphs(paragraphs, CHUNK_TARGET_WORDS, CHUNK_OVERLAP_WORDS);
}
