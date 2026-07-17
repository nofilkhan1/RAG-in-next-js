// API route integration test
// Run with: npx tsx scripts/test-api-routes.mjs

import { createRequire } from "module";
import { readFileSync, writeFileSync, mkdtempSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import http from "http";

const PORT = 3461;
const BASE = "http://localhost:" + PORT;

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
      }
    }
  }
} catch (e) {}

function fetch(method, path, body, contentType) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "localhost",
      port: PORT,
      path,
      method,
      headers: {},
    };
    if (body) {
      if (typeof body === "string") {
        opts.headers["Content-Type"] = contentType || "application/json";
        opts.headers["Content-Length"] = Buffer.byteLength(body);
      } else if (body instanceof Buffer) {
        opts.headers["Content-Type"] = contentType || "application/octet-stream";
        opts.headers["Content-Length"] = body.length;
      }
    }
    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) {
      if (typeof body === "string") req.write(body);
      else if (body instanceof Buffer) req.write(body);
    }
    req.end();
  });
}

function buildMultipart(fields, fileField, filePath) {
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
  const content = [];
  for (const [key, val] of Object.entries(fields)) {
    content.push("--" + boundary);
    content.push('Content-Disposition: form-data; name="' + key + '"');
    content.push("");
    content.push(val);
  }
  if (filePath) {
    const fileName = filePath.split(/[\\/]/).pop();
    const fileData = readFileSync(filePath);
    content.push("--" + boundary);
    content.push('Content-Disposition: form-data; name="file"; filename="' + fileName + '"');
    content.push("Content-Type: text/plain");
    content.push("");
    content.push(fileData.toString());
  }
  content.push("--" + boundary + "--");
  const body = content.join("\r\n");
  return {
    body,
    contentType: "multipart/form-data; boundary=" + boundary,
  };
}

async function runTests() {
  console.log("=== Phase 4: API Route Tests ===\n");

  // --- Test 1: GET /api/chapters (no bookId) ---
  console.log("--- Test 1: GET /api/chapters (missing bookId) ---");
  const r1 = await fetch("GET", "/api/chapters");
  console.log("Status:", r1.status, "(expected 400)");
  console.log("Body:", JSON.stringify(r1.body));
  console.log(r1.status === 400 ? "  PASS" : "  FAIL");
  console.log("");

  // --- Test 2: GET /api/chapters?bookId=empty ---
  console.log("--- Test 2: GET /api/chapters?bookId=test (empty) ---");
  const r2 = await fetch("GET", "/api/chapters?bookId=test");
  console.log("Status:", r2.status, "(expected 200)");
  console.log("Body:", JSON.stringify(r2.body));
  console.log(r2.status === 200 && Array.isArray(r2.body.chapters) ? "  PASS" : "  FAIL");
  console.log("");

  // --- Test 3: POST /api/ask (invalid body) ---
  console.log("--- Test 3: POST /api/ask (missing fields) ---");
  const r3 = await fetch("POST", "/api/ask", JSON.stringify({ question: "hi" }));
  console.log("Status:", r3.status, "(expected 400)");
  console.log("Body:", JSON.stringify(r3.body));
  console.log(r3.status === 400 ? "  PASS" : "  FAIL");
  console.log("");

  // --- Test 4: POST /api/upload (no file) ---
  console.log("--- Test 4: POST /api/upload (no file) ---");
  const r4 = await fetch("POST", "/api/upload");
  console.log("Status:", r4.status, "(expected 400)");
  console.log("Body:", JSON.stringify(r4.body));
  console.log(r4.status === 400 ? "  PASS" : "  FAIL");
  console.log("");

  // --- Test 5: POST /api/upload with TXT file ---
  console.log("--- Test 5: POST /api/upload (TXT file) ---");
  const tmpDir = mkdtempSync(join(resolve(__dirname, ".."), "tmp-"));
  const tmpFile = join(tmpDir, "physics_ch1.txt");
  writeFileSync(
    tmpFile,
    [
      "CHAPTER 1: NEWTONIAN MECHANICS",
      "",
      "Newton's first law states that an object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.",
      "",
      "Newton's second law states that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. F = ma.",
      "",
      "Newton's third law states that for every action there is an equal and opposite reaction.",
      "",
      "The law of universal gravitation: F = G(m1*m2)/r^2.",
    ].join("\n"),
    "utf-8"
  );

  const { body, contentType } = buildMultipart(
    { bookId: "physics101", chapterId: "ch1" },
    "file",
    tmpFile
  );
  const r5 = await fetch(
    "POST",
    "/api/upload",
    Buffer.from(body, "utf-8"),
    contentType
  );
  console.log("Status:", r5.status, "(expected 200)");
  console.log("Body:", JSON.stringify(r5.body));
  const uploadOk =
    r5.status === 200 && r5.body.status === "indexed" && r5.body.numChunks > 0;
  console.log(uploadOk ? "  PASS" : "  FAIL");
  console.log("");

  // --- Test 6: List chapters after upload ---
  console.log("--- Test 6: GET /api/chapters?bookId=physics101 ---");
  const r6 = await fetch("GET", "/api/chapters?bookId=physics101");
  console.log("Status:", r6.status, "(expected 200)");
  console.log("Body:", JSON.stringify(r6.body));
  console.log(
    r6.status === 200 && r6.body.chapters.includes("ch1") ? "  PASS" : "  FAIL"
  );
  console.log("");

  // --- Test 7: Ask a question ---
  console.log("--- Test 7: POST /api/ask (valid question) ---");
  const r7 = await fetch(
    "POST",
    "/api/ask",
    JSON.stringify({
      question: "What does Newton's first law say?",
      bookId: "physics101",
      chapterId: "ch1",
    })
  );
  console.log("Status:", r7.status, "(expected 200)");
  console.log("Body:", JSON.stringify(r7.body, null, 2));
  const askOk =
    r7.status === 200 &&
    r7.body.answer &&
    r7.body.answer.length > 20 &&
    r7.body.sourcesUsed > 0;
  console.log(askOk ? "  PASS" : "  FAIL");
  console.log("");

  // --- Test 8: Ask out-of-domain question ---
  console.log("--- Test 8: POST /api/ask (unrelated topic) ---");
  const r8 = await fetch(
    "POST",
    "/api/ask",
    JSON.stringify({
      question: "What is the capital of France?",
      bookId: "physics101",
      chapterId: "ch1",
    })
  );
  console.log("Status:", r8.status, "(expected 200)");
  console.log("Body:", JSON.stringify(r8.body, null, 2));
  const outOfDomainOk =
    r8.status === 200 &&
    r8.body.answer &&
    r8.body.answer.toLowerCase().includes("not cover");
  console.log(outOfDomainOk ? "  PASS" : "  FAIL");
  console.log("");

  // Cleanup
  try {
    const fs = await import("fs");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}

  console.log("=== Phase 4 Tests Complete ===");
}

runTests().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});

