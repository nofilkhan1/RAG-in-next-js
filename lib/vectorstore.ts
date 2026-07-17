import * as lancedb from "@lancedb/lancedb";
import { v4 as uuidv4 } from "uuid";
import {
  Chunk,
  ChapterInfo,
  LANCE_DB_PATH,
  COLLECTION_NAME,
  TOP_K,
  EMBEDDING_DIM,
} from "./types";
import { embed } from "./embeddings";

interface ChunkRecord {
  id: string;
  text: string;
  book_id: string;
  chapter_id: string;
  chunk_index: number;
  vector: Float32Array;
}

let db: lancedb.Connection | null = null;
let table: lancedb.Table | null = null;

function makeFilter(bookId: string, chapterId: string): string {
  return [
    "book_id = '",
    bookId.replace(/'/g, "\\'"),
    "' AND chapter_id = '",
    chapterId.replace(/'/g, "\\'"),
    "'",
  ].join("");
}

function makeBookFilter(bookId: string): string {
  return ["book_id = '", bookId.replace(/'/g, "\\'"), "'"].join("");
}

async function initDB(): Promise<lancedb.Table> {
  if (table) return table;

  db = await lancedb.connect(LANCE_DB_PATH);

  const tableNames = await db.tableNames();

  if (tableNames.includes(COLLECTION_NAME)) {
    table = await db.openTable(COLLECTION_NAME);
  } else {
    table = await db.createTable(COLLECTION_NAME, [
      {
        id: "",
        text: "",
        book_id: "",
        chapter_id: "",
        chunk_index: 0,
        vector: new Float32Array(EMBEDDING_DIM),
      },
    ]);
    await table.delete('id = ""');
  }

  return table;
}

export async function addChunks(
  chunks: string[],
  bookId: string,
  chapterId: string
): Promise<number> {
  const tbl = await initDB();

  const vectors = await embed(chunks);

  const records: Record<string, unknown>[] = chunks.map((text, i) => ({
    id: uuidv4(),
    text,
    book_id: bookId,
    chapter_id: chapterId,
    chunk_index: i,
    vector: new Float32Array(vectors[i]),
  }));

  await tbl.add(records);
  return records.length;
}

export async function queryChunks(
  question: string,
  bookId: string,
  chapterId: string,
  topK: number = TOP_K
): Promise<Chunk[]> {
  const tbl = await initDB();

  const [questionVector] = await embed([question]);

  const results = await tbl
    .search(new Float32Array(questionVector))
    .where(makeFilter(bookId, chapterId))
    .limit(topK)
    .toArray();

  return results.map((r) => ({
    id: r.id,
    text: r.text,
    bookId: r.book_id,
    chapterId: r.chapter_id,
    chunkIndex: r.chunk_index,
    vector: Array.from(r.vector),
  }));
}

export async function listChapters(bookId: string): Promise<string[]> {
  const tbl = await initDB();

  const results = await tbl
    .query()
    .where(makeBookFilter(bookId))
    .select(["chapter_id"])
    .toArray();

  const chapters = [...new Set(results.map((r) => r.chapter_id))];
  return chapters.sort();
}

export async function getChapterInfo(bookId: string): Promise<ChapterInfo[]> {
  const tbl = await initDB();

  const results = await tbl
    .query()
    .where(makeBookFilter(bookId))
    .select(["chapter_id"])
    .toArray();

  const counts = new Map<string, number>();
  for (const r of results) {
    counts.set(r.chapter_id, (counts.get(r.chapter_id) || 0) + 1);
  }

  return Array.from(counts.entries()).map(([chapterId, chunkCount]) => ({
    bookId,
    chapterId,
    chunkCount,
  }));
}

export async function deleteChapter(
  bookId: string,
  chapterId: string
): Promise<void> {
  const tbl = await initDB();
  await tbl.delete(makeFilter(bookId, chapterId));
}

export async function clearAll(): Promise<void> {
  const tbl = await initDB();
  await tbl.delete('id != ""');
}
