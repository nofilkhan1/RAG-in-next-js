// Chapters API route - list indexed chapters for a book

import { NextRequest, NextResponse } from 'next/server';
import { ErrorResponse } from '@/lib/types';
import { listChapters } from '@/lib/vectorstore';

export async function GET(request: NextRequest): Promise<NextResponse<{ chapters: string[] } | ErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
    }

    const chapters = await listChapters(bookId);
    
    return NextResponse.json({ chapters });

  } catch (error) {
    console.error('Chapters error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list chapters' },
      { status: 500 }
    );
  }
}
