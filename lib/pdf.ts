// PDF text extraction using pdf-parse-fork

import pdfParse from "pdf-parse-fork";

/**
 * Extract text content from a PDF buffer
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF. File may be corrupted or password-protected.");
  }
}

/**
 * Check if buffer starts with PDF magic bytes
 */
export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
}

/**
 * Check if buffer is valid UTF-8 text
 */
export function isTextBuffer(buffer: Buffer): boolean {
  try {
    const text = buffer.toString("utf-8");
    return !text.includes("\u0000");
  } catch {
    return false;
  }
}

/**
 * Validate if a buffer is a valid PDF
 */
export async function isValidPdf(buffer: Buffer): Promise<boolean> {
  try {
    await pdfParse(buffer);
    return true;
  } catch {
    return false;
  }
}
