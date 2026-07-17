// Ask API route - embed query, search vector store, generate answer

import { NextRequest, NextResponse } from 'next/server';
import { askSchema, AskResponse, ErrorResponse } from '@/lib/types';
import { queryChunks } from '@/lib/vectorstore';
import { generateAnswer } from '@/lib/generate';

export async function POST(request: NextRequest): Promise<NextResponse<AskResponse | ErrorResponse>> {
  try {
    const body = await request.json();
    
    // Validate request
    const validation = askSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors.map(e => e.message).join(', ') },
        { status: 400 }
      );
    }

    const { question, bookId, chapterId } = validation.data;

    // Query vector store for relevant chunks
    const chunks = await queryChunks(question, bookId, chapterId);
    
    if (!chunks.length) {
      return NextResponse.json({
        answer: 'No relevant content found in this chapter for your question.',
        sourcesUsed: 0,
      });
    }

    // Generate grounded answer
    const answer = await generateAnswer(chunks.map(c => c.text), question);

    return NextResponse.json({
      answer,
      sourcesUsed: chunks.length,
    });

  } catch (error) {
    console.error('Ask error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate answer' },
      { status: 500 }
    );
  }
}
