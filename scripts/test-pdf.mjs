// Test script for PDF module functions
// Run with: npx tsx scripts/test-pdf.mjs

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { isPdfBuffer, isTextBuffer, extractTextFromPdf } = require("../lib/pdf");

console.log("=== Phase 1: PDF Module Tests ===\n");

// Test 1: isPdfBuffer
console.log("--- Test 1: isPdfBuffer ---");
const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const textHeader = Buffer.from("Hello World");
console.log("PDF header detected:", isPdfBuffer(pdfHeader) ? "PASS" : "FAIL");
console.log("Text rejected:", !isPdfBuffer(textHeader) ? "PASS" : "FAIL");

// Test 2: isTextBuffer
console.log("\n--- Test 2: isTextBuffer ---");
console.log("Valid UTF-8 text:", isTextBuffer(Buffer.from("Hello World")) ? "PASS" : "FAIL");
console.log("Null byte rejected:", !isTextBuffer(Buffer.from([0x48, 0x00, 0x65])) ? "PASS" : "FAIL");

// Test 3: extractTextFromPdf
console.log("\n--- Test 3: extractTextFromPdf ---");
console.log("Function exported:", typeof extractTextFromPdf === "function" ? "PASS" : "FAIL");

// Test 4: Module exports
console.log("\n--- Test 4: All exports ---");
console.log("isPdfBuffer:", typeof isPdfBuffer);
console.log("isTextBuffer:", typeof isTextBuffer);
console.log("extractTextFromPdf:", typeof extractTextFromPdf);

console.log("\n=== Phase 1: PDF Tests Complete ===");
