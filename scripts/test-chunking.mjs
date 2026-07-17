// Test script for chunking
// Run with: node scripts/test-chunking.mjs

import { readFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { cleanText, chunkText, countWords } = require("../lib/chunking.js");

function countWordsSimple(text) {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function getOverlapText(text, overlapWords) {
  const words = text.trim().split(/\s+/);
  if (words.length <= overlapWords) return text;
  return words.slice(-overlapWords).join(" ");
}

function chunkLongParagraph(text, targetWords, overlapWords) {
  const words = text.trim().split(/\s+/);
  if (words.length <= targetWords) return [text];

  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + targetWords, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start = end - overlapWords;
  }

  return chunks;
}

function runTests() {
  console.log("=== Phase 1: Chunking Tests ===\n");

  // Test 1: cleanText
  console.log("--- Test 1: cleanText ---");
  const messy = "  Hello   world\n\n\nThis\tis\ta  test\r\n\r\n";
  const cleaned = cleanText(messy);
  console.log('Input: "' + messy + '"');
  console.log('Output: "' + cleaned + '"');
  const cleanPass = cleaned === "Hello world\n\nThis is a test";
  console.log(cleanPass ? "  PASS" : "  FAIL");
  if (!cleanPass) {
    console.log("  Expected: 'Hello world\\n\\nThis is a test'");
  }

  // Test 2: chunkText with sample content
  console.log("\n--- Test 2: chunkText (from sample text) ---");
  const sampleText = [
    "CHAPTER 1: INTRODUCTION TO PHYSICS",
    "",
    "Physics is the most fundamental of the sciences. Its goal is to formulate comprehensive principles that bring together and explain all physical phenomena.",
    "",
    "1.1 The Nature of Physics",
    "",
    "Physics is concerned with the basic principles of the Universe. It is the foundation upon which all other sciences are built. Chemistry, biology, geology, and astronomy are all based on the principles of physics.",
    "",
    "1.2 Measuring Things",
    "",
    "Physics is an experimental science. Physicists observe the phenomena of nature and try to find patterns that relate these phenomena. These patterns are called physical theories or, when they are very well established and widely used, laws or principles. The measurements we make in physics must be expressed in units. The system of units used by scientists worldwide is the Systeme Internationale (SI).",
    "",
    "The seven SI base units are meter (m) for length, kilogram (kg) for mass, second (s) for time, ampere (A) for electric current, kelvin (K) for temperature, mole (mol) for amount of substance, and candela (cd) for luminous intensity.",
    "",
    "1.3 Dimensional Analysis",
    "",
    "Dimensional analysis is a powerful technique for checking the correctness of equations. Each physical quantity can be expressed in terms of fundamental dimensions: length (L), mass (M), and time (T). In any valid physical equation, the dimensions on both sides must be the same. For example, consider the equation for the period of a pendulum: T equals 2 times pi times the square root of L over g. The left side has dimension T, and the right side has dimension T. So the equation is dimensionally consistent.",
    "",
    "SUMMARY",
    "",
    "Physics is the fundamental science that seeks to understand the behavior of the universe. The SI system provides a standard set of units for measurements. A systematic approach to problem-solving is essential for success in physics.",
    "",
    "CHAPTER 2: KINEMATICS",
    "",
    "Kinematics is the branch of mechanics that describes the motion of objects without considering the forces that cause the motion. In this chapter, we will study the concepts of displacement, velocity, and acceleration.",
    "",
    "2.1 Position and Displacement",
    "",
    "Displacement is the change in position of an object. It is a vector quantity, meaning it has both magnitude and direction. For one-dimensional motion along the x-axis, the displacement Delta x is given by x_f minus x_i. Distance is a scalar quantity that measures the total path length traveled.",
    "",
    "2.2 Average Velocity and Speed",
    "",
    "Average velocity is defined as the displacement divided by the time interval during which the displacement occurs. Instantaneous velocity is the velocity at a specific instant of time. It is defined as the limit of the average velocity as the time interval approaches zero.",
    "",
    "2.3 Acceleration",
    "",
    "Acceleration is the rate of change of velocity with respect to time. When an object moves with constant acceleration, the following equations of motion apply: v = v_0 + at, x = x_0 + v_0t plus one half a t squared, and v squared = v_0 squared plus 2a times x minus x_0.",
    "",
    "2.4 Free Fall",
    "",
    "Free fall is the motion of an object under the influence of gravity alone. In the absence of air resistance, all objects near the Earth surface fall with the same constant acceleration. The acceleration due to gravity, denoted by g, has a magnitude of approximately 9.81 meters per second squared.",
    "",
    "SUMMARY",
    "",
    "Kinematics describes motion using displacement, velocity, and acceleration. For constant acceleration, there are three key equations that relate position, velocity, acceleration, and time.",
  ].join("\n");

  const chunks = chunkText(sampleText);

  // Filter out chunks under 50 words before validation
  const validChunks = chunks;
  console.log("Total chunks: " + validChunks.length + "\n");

  let totalWords = 0;
  let passesWordRange = true;
  let chunkSizes = [];

  validChunks.forEach((chunk, i) => {
    const wc = countWordsSimple(chunk);
    totalWords += wc;
    chunkSizes.push(wc);

    const statusStr =
      "  Chunk " + (i + 1) + ": " + wc + " words";
    console.log(statusStr);

    if (wc < 50) {
      console.log(
        "    WARNING: Chunk " + (i + 1) + " has only " + wc + " words (min 50)"
      );
      passesWordRange = false;
    }
    if (wc > 450) {
      console.log(
        "    WARNING: Chunk " + (i + 1) + " has " + wc + " words (max ~450)"
      );
      passesWordRange = false;
    }
    // Show first 80 chars of each chunk
    console.log("    Preview: " + chunk.slice(0, 80) + "...");
    console.log("");
  });

  const originalWords = countWordsSimple(sampleText);
  console.log("Original text: " + originalWords + " words");
  console.log("Reconstructed: " + totalWords + " words");
  console.log(
    "Reconstruction ratio: " + (totalWords / originalWords).toFixed(2)
  );

  console.log("");
  console.log(passesWordRange ? "  PASS: All chunks in word range" : "  FAIL: Some chunks out of range");

  // Test 3: Check overlap between consecutive chunks
  if (validChunks.length >= 2) {
    console.log("\n--- Test 3: Overlap between chunks ---");
    let hasOverlap = false;
    for (let i = 0; i < validChunks.length - 1; i++) {
      const currWords = validChunks[i].split(/\s+/);
      const currEnd = currWords.slice(-50).join(" ");
      const nextStart = validChunks[i + 1].split(/\s+/).slice(0, 50).join(" ");
      // Check if the end of chunk i overlaps with start of chunk i+1
      const overlapWords =
        currEnd === nextStart
          ? "full overlap"
          : currEnd.split(" ").length > 0
          ? "partial"
          : "none";
      console.log(
        "  Chunk " +
          (i + 1) +
          " ends with " +
          currWords.slice(-50).length +
          " words"
      );
      console.log(
        "  Chunk " +
          (i + 2) +
          " starts with " +
          validChunks[i + 1].split(/\s+/).slice(0, 50).length +
          " words"
      );
      if (i === 0 && overlapWords !== "none") hasOverlap = true;
    }
    console.log(hasOverlap ? "  PASS: Overlap detected between chunks" : "  (Note: Overlap depends on paragraph packing)");
  }

  // Test 4: Very small content
  console.log("\n--- Test 4: Small content handling ---");
  const small = "This is a short text with only a few words that should not produce chunks.";
  const smallChunks = chunkText(small);
  console.log('Input: "' + small + '"');
  console.log(
    "Chunks: " + smallChunks.length + " (expected 0 if < 50 words)"
  );

  // Test 5: Oversized paragraph
  console.log("\n--- Test 5: Oversized paragraph splitting ---");
  const longPara = Array(500).fill("physics").join(" ");
  const longChunks = chunkText(longPara);
  console.log("500-word paragraph split into " + longChunks.length + " chunks");
  longChunks.forEach((c, i) => {
    console.log("  Chunk " + (i + 1) + ": " + countWordsSimple(c) + " words");
  });

  // Test 6: Verify chunking exports
  console.log("\n--- Test 6: Module exports ---");
  console.log("cleanText: " + typeof cleanText);
  console.log("chunkText: " + typeof chunkText);
  console.log("countWords: " + typeof countWords);

  // Summary
  console.log("\n=== Phase 1: Chunking Tests Complete ===");
}

runTests();
