// Local embeddings using Xenova/transformers (MiniLM)

import { pipeline } from '@xenova/transformers';
import { EMBEDDING_MODEL, EMBEDDING_DIM } from './types';

// Singleton pipeline instance
let embedder: any = null;
let embedderPromise: Promise<any> | null = null;

/** Get or create the embedding pipeline (lazy initialization) */
async function getEmbedder(): Promise<any> {
  if (embedder) return embedder;
  
  if (!embedderPromise) {
    embedderPromise = (async () => {
      console.log('[Embeddings] Loading model:', EMBEDDING_MODEL);
      const pipe = await pipeline('feature-extraction', EMBEDDING_MODEL, {
        quantized: true,
      });
      console.log('[Embeddings] Model loaded successfully');
      return pipe;
    })();
  }
  
  embedder = await embedderPromise;
  return embedder;
}

/** Generate embeddings for an array of texts */
export async function embed(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  
  const pipe = await getEmbedder();
  
  // Process in batches to avoid memory issues
  const batchSize = 32;
  const allEmbeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const outputs = await pipe(batch, { 
      pooling: 'mean', 
      normalize: true 
    });
    
    // outputs is a 2D tensor [batch_size, hidden_dim]
    const embeddings = outputs.data as Float32Array;
    const dim = outputs.dims[outputs.dims.length - 1];
    
    for (let j = 0; j < batch.length; j++) {
      const start = j * dim;
      const end = start + dim;
      allEmbeddings.push(Array.from(embeddings.slice(start, end)));
    }
  }
  
  return allEmbeddings;
}

/** Generate embedding for a single text */
export async function embedSingle(text: string): Promise<number[]> {
  const [embedding] = await embed([text]);
  return embedding;
}

/** Get embedding dimension */
export function getEmbeddingDim(): number {
  return EMBEDDING_DIM;
}
