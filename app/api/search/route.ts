import { NextRequest, NextResponse } from 'next/server';
import { searchSchema, SearchResponse, ErrorResponse } from '@/lib/types';
import { searchBook } from '@/lib/vectorstore';

export async function POST(request: NextRequest): Promise<NextResponse<SearchResponse | ErrorResponse>> {
  try {
    const body = await request.json();

    const validation = searchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors.map(e => e.message).join(', ') },
        { status: 400 }
      );
    }

    const { query, bookId } = validation.data;

    const results = await searchBook(query, bookId);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
