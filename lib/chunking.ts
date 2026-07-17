// Text cleaning and paragraph-aware chunking

/**
 * Clean raw text by normalizing whitespace and removing artifacts
 */
export function cleanText(text: string): string {
  return text
    // Replace various whitespace with single space
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    // Remove zero-width spaces and other invisible chars
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize multiple newlines to double newline (paragraph break)
    .replace(/\n{3,}/g, '\n\n')
    // Normalize multiple spaces to single space
    .replace(/[ \t]{2,}/g, ' ')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

/**
 * Chunk text into overlapping segments (~400 words with 50-word overlap)
 * Paragraph-aware: splits on \n\n first, then packs paragraphs
 */
export function chunkText(text: string, targetWords = 400, overlapWords = 50): string[] {
  const cleaned = cleanText(text);
  
  if (!cleaned) return [];

  // Split into paragraphs first
  const paragraphs = cleaned.split('\n\n').filter(p => p.trim().length > 0);
  
  if (paragraphs.length === 0) return [];

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const paraWords = para.trim().split(/\s+/).length;
    
    // If single paragraph exceeds target, split it by sentences/words
    if (paraWords > targetWords) {
      // Flush current chunk first
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
        currentChunk = [];
        currentWordCount = 0;
      }
      // Split oversized paragraph using word-window approach
      const paraChunks = chunkLongParagraph(para, targetWords, overlapWords);
      chunks.push(...paraChunks);
      continue;
    }

    // If adding this paragraph would exceed target, finalize current chunk
    if (currentWordCount + paraWords > targetWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
      
      // Start new chunk with overlap from previous chunk
      const overlapText = getOverlapText(currentChunk.join('\n\n'), overlapWords);
      currentChunk = overlapText ? [overlapText, para] : [para];
      currentWordCount = overlapText 
        ? overlapText.split(/\s+/).length + paraWords 
        : paraWords;
    } else {
      currentChunk.push(para);
      currentWordCount += paraWords;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  // Filter out very small chunks (less than 50 words)
  return chunks.filter(chunk => chunk.split(/\s+/).length >= 50);
}

/**
 * Split a long paragraph using sliding word window
 */
function chunkLongParagraph(text: string, targetWords: number, overlapWords: number): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length <= targetWords) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + targetWords, words.length);
    chunks.push(words.slice(start, end).join(' '));
    
    if (end === words.length) break;
    start = end - overlapWords;
  }

  return chunks;
}

/**
 * Get overlap text from end of a chunk (last N words)
 */
function getOverlapText(text: string, overlapWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= overlapWords) return text;
  return words.slice(-overlapWords).join(' ');
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}
