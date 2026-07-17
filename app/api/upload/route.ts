// Upload API route - extract, chunk, embed, and store PDF/TXT chapters

import { NextRequest, NextResponse } from 'next/server';
import { uploadSchema, UploadResponse, ErrorResponse } from '@/lib/types';
import { extractTextFromPdf, isPdfBuffer, isTextBuffer } from '@/lib/pdf';
import { chunkText } from '@/lib/chunking';
import { addChunks } from '@/lib/vectorstore';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'text/plain'];

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse | ErrorResponse>> {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    
    const file = formData.get('file') as File | null;
    const bookId = formData.get('bookId') as string | null;
    const chapterId = formData.get('chapterId') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!bookId || !chapterId) {
      return NextResponse.json({ error: 'bookId and chapterId are required' }, { status: 400 });
    }

    // Validate with Zod
    const validation = uploadSchema.safeParse({ bookId, chapterId });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors.map(e => e.message).join(', ') },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Validate file type
    const buffer = Buffer.from(await file.arrayBuffer());
    const isPdf = isPdfBuffer(buffer);
    const isText = isTextBuffer(buffer);

    if (!isPdf && !isText) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and TXT files are supported.' },
        { status: 400 }
      );
    }

    // Extract text
    let text: string;
    if (isPdf) {
      text = await extractTextFromPdf(buffer);
    } else {
      text = buffer.toString('utf-8');
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'No text content extracted from file' }, { status: 400 });
    }

    // Chunk text
    const chunks = chunkText(text);
    if (!chunks.length) {
      return NextResponse.json({ error: 'No valid chunks generated from text' }, { status: 400 });
    }

    // Store in vector database
    const numChunks = await addChunks(chunks, bookId, chapterId);

    return NextResponse.json({
      status: 'indexed',
      bookId,
      chapterId,
      numChunks,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
