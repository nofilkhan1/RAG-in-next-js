// Phase 2 test: Embeddings + Vector Store
// Run with: npx tsx scripts/test-vectorstore.mjs

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { embed, embedSingle } = require("../lib/embeddings");
const {
  addChunks,
  queryChunks,
  listChapters,
  clearAll,
} = require("../lib/vectorstore");
const { chunkText } = require("../lib/chunking");

function countWords(text) {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

async function runTests() {
  console.log("=== Phase 2: Embeddings + Vector Store Tests ===\n");

  // ----- Embeddings Tests -----
  console.log("--- Embeddings: Load Model ---");
  const startTime = Date.now();
  const result = await embed(["test sentence"]);
  const loadTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("Model loaded in " + loadTime + "s");
  console.log("Embedding dimension: " + result[0].length);
  console.log("Expected dimension: 384");
  console.log(
    "Dimension match: " + (result[0].length === 384 ? "PASS" : "FAIL")
  );
  console.log("");

  // Batch embedding
  console.log("--- Embeddings: Batch ---");
  const texts = [
    "Newton's first law of motion",
    "The speed of light in vacuum",
    "Thermodynamics is the study of heat",
  ];
  const batchResult = await embed(texts);
  console.log("Batch size: " + batchResult.length + " (expected 3)");
  console.log("Each vector length: " + batchResult[0].length);
  console.log("Batch all correct: " + (batchResult.length === 3 ? "PASS" : "FAIL"));
  console.log("");

  // ----- Vector Store Tests -----
  console.log("--- Vector Store: Add Chunks for physics101/chapter1 ---");
  await clearAll();

  const chapter1Text = [
    "Newton's first law states that an object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.",
    "Newton's second law states that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. The equation is F equals ma.",
    "Newton's third law states that for every action, there is an equal and opposite reaction. This means that forces always come in pairs.",
    "The law of universal gravitation states that every particle attracts every other particle with a force that is proportional to the product of their masses and inversely proportional to the square of the distance between them.",
    "Conservation of energy is a fundamental principle stating that energy cannot be created or destroyed, only converted from one form to another.",
  ];

  const count1 = await addChunks(chapter1Text, "physics101", "chapter1");
  console.log("Chunks added: " + count1 + " (expected 5)");
  console.log("Add result: " + (count1 === 5 ? "PASS" : "FAIL"));
  console.log("");

  console.log("--- Vector Store: Add Chunks for physics101/chapter2 ---");
  const chapter2Text = [
    "Electric charge is a fundamental property of matter. There are two types of charge: positive and negative. Like charges repel, unlike charges attract.",
    "Coulomb's law gives the force between two charged particles. The force is proportional to the product of the charges and inversely proportional to the square of the distance between them.",
    "An electric field is a region around a charged object where other charges experience a force. The electric field strength is defined as force per unit charge.",
    "Electric potential is the electric potential energy per unit charge. Voltage is another name for electric potential difference.",
    "Ohm's law states that the current through a conductor is directly proportional to the voltage across it and inversely proportional to its resistance.",
  ];

  const count2 = await addChunks(chapter2Text, "physics101", "chapter2");
  console.log("Chunks added: " + count2 + " (expected 5)");
  console.log("Add result: " + (count2 === 5 ? "PASS" : "FAIL"));
  console.log("");

  console.log("--- Vector Store: List Chapters ---");
  const chapters = await listChapters("physics101");
  console.log("Chapters found: " + JSON.stringify(chapters));
  console.log("Contains chapter1: " + chapters.includes("chapter1"));
  console.log("Contains chapter2: " + chapters.includes("chapter2"));
  console.log(
    "List chapters: " +
      (chapters.includes("chapter1") && chapters.includes("chapter2") && chapters.length === 2
        ? "PASS"
        : "FAIL")
  );
  console.log("");

  // Query chapter1 - should only return chapter1 chunks
  console.log("--- Vector Store: Query on physics101/chapter1 ---");
  const q1 = await queryChunks("What does Newton's first law say?", "physics101", "chapter1", 3);
  console.log("Results for chapter1 query: " + q1.length);
  console.log("All results are from chapter1: " + q1.every((r) => r.chapterId === "chapter1") ? "PASS" : "FAIL");
  q1.forEach((r, i) => {
    console.log("  " + (i + 1) + ". [" + r.chapterId + "] " + r.text.slice(0, 60) + "...");
  });
  console.log("");

  // Query chapter2 - should only return chapter2 chunks
  console.log("--- Vector Store: Query on physics101/chapter2 ---");
  const q2 = await queryChunks("How does electric charge work?", "physics101", "chapter2", 3);
  console.log("Results for chapter2 query: " + q2.length);
  console.log("All results are from chapter2: " + (q2.every((r) => r.chapterId === "chapter2") ? "PASS" : "FAIL"));
  q2.forEach((r, i) => {
    console.log("  " + (i + 1) + ". [" + r.chapterId + "] " + r.text.slice(0, 60) + "...");
  });
  console.log("");

  // Cross-chapter query should NOT return results from other chapter
  console.log("--- Vector Store: Cross-chapter filtering ---");
  const crossQ = await queryChunks("electric charge", "physics101", "chapter1", 5);
  console.log("Query 'electric charge' on chapter1: " + crossQ.length + " results");
  console.log("All from chapter1: " + (crossQ.every((r) => r.chapterId === "chapter1") ? "PASS" : "FAIL"));
  const chapter2InResults = crossQ.filter((r) => r.chapterId === "chapter2").length;
  console.log(
    "ZERO results from chapter2 when querying chapter1: " +
      (chapter2InResults === 0 ? "PASS" : "FAIL - found " + chapter2InResults + " from chapter2")
  );
  console.log("");

  // Cleanup
  console.log("--- Vector Store: Cleanup ---");
  await clearAll();
  const chaptersAfter = await listChapters("physics101");
  console.log("Chapters after clear: " + chaptersAfter.length + " (expected 0)");
  console.log("Clear: " + (chaptersAfter.length === 0 ? "PASS" : "FAIL"));
  console.log("");

  console.log("=== Phase 2 Tests Complete ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
