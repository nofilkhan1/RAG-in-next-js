// Phase 3 test: Generation with Groq
// Run with: npx tsx scripts/test-generate.mjs

import { createRequire } from "module";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.local manually
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
} catch (e) {
  console.warn("Could not load .env.local:", e.message);
}

const require = createRequire(import.meta.url);
const { generateAnswer, generateAnswerStream } = require("../lib/generate");

const physicsChunks = [
  "Newton's first law of motion states that an object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced external force.",
  "Newton's second law of motion states that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. This is expressed mathematically as F = ma, where F is force, m is mass, and a is acceleration.",
  "Newton's third law of motion states that for every action force there is an equal and opposite reaction force. When one object exerts a force on a second object, the second object exerts a force equal in magnitude and opposite in direction on the first object.",
];

const biologyChunks = [
  "Mitosis is the process of cell division that produces two identical daughter cells. It consists of prophase, metaphase, anaphase, and telophase.",
  "Meiosis is a specialized form of cell division that produces four non-identical gamete cells. It involves two rounds of division and reduces the chromosome number by half.",
];

async function runTests() {
  console.log("=== Phase 3: Generation Tests ===\n");

  // Test 1: Grounded answer from physics context
  console.log("--- Test 1: Grounded answer (physics) ---");
  try {
    const answer = await generateAnswer(
      physicsChunks,
      "What does Newton's first law say?"
    );
    console.log("Question: What does Newton's first law say?");
    console.log("Answer:", answer);
    console.log("");

    // Verify answer references the provided content
    const mentionsInertia =
      /object at rest|in motion|unbalanced|external force/i.test(answer);
    console.log(
      "Contains relevant content: " + (mentionsInertia ? "PASS" : "FAIL (review)")
    );
  } catch (err) {
    console.error("FAIL:", err.message);
  }
  console.log("");

  // Test 2: Answer not in provided context
  console.log("--- Test 2: Unknown topic ---");
  try {
    const answer = await generateAnswer(
      physicsChunks,
      "What is the capital of France?"
    );
    console.log("Question: What is the capital of France?");
    console.log("Answer:", answer);
    const coversTopic = /not cover|not provided|not found|don't have|not in/i.test(
      answer
    );
    console.log(
      "Correctly declines to answer: " + (coversTopic ? "PASS" : "FAIL (review)")
    );
  } catch (err) {
    console.error("FAIL:", err.message);
  }
  console.log("");

  // Test 3: Empty chunks
  console.log("--- Test 3: Empty chunks ---");
  try {
    const answer = await generateAnswer([], "What is physics?");
    console.log("Empty chunks answer:", answer);
    const declines = /not cover/i.test(answer);
    console.log("Declines gracefully: " + (declines ? "PASS" : "FAIL (review)"));
  } catch (err) {
    console.error("FAIL:", err.message);
  }
  console.log("");

  // Test 4: Biology context (different domain)
  console.log("--- Test 4: Biology context ---");
  try {
    const answer = await generateAnswer(
      biologyChunks,
      "What is the difference between mitosis and meiosis?"
    );
    console.log("Question: What is the difference between mitosis and meiosis?");
    console.log("Answer:", answer);
    const mentionsProcesses = /mitosis|meiosis|daughter|gamete|identical|chromosome/i.test(
      answer
    );
    console.log(
      "Answer based on context: " + (mentionsProcesses ? "PASS" : "FAIL (review)")
    );
  } catch (err) {
    console.error("FAIL:", err.message);
  }
  console.log("");

  // Test 5: Streaming (basic check)
  console.log("--- Test 5: Streaming ---");
  try {
    let streamedText = "";
    for await (const chunk of generateAnswerStream(
      physicsChunks,
      "Explain Newton's second law."
    )) {
      streamedText += chunk;
    }
    console.log("Streamed answer length:", streamedText.length, "chars");
    console.log("Stream starts:", streamedText.slice(0, 80) + "...");
    console.log(
      "Stream produced output: " +
        (streamedText.length > 0 ? "PASS" : "FAIL")
    );
  } catch (err) {
    console.error("FAIL:", err.message);
  }
  console.log("");

  console.log("=== Phase 3 Tests Complete ===");
}

runTests().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
