import Groq from "groq-sdk";
import { GROQ_MODEL, GROQ_TEMPERATURE, GROQ_MAX_TOKENS } from "./types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = [
  "You are a helpful study assistant. Answer questions using ONLY the provided chapter excerpts.",
  "Follow these rules strictly:",
  "1. Use ONLY information from the provided excerpts.",
  "2. If the answer is not in the excerpts, say: The chapter does not cover this topic.",
  "3. Do not use outside knowledge.",
  "4. Be concise but complete.",
  "5. Cite sources by referencing excerpt numbers like [1], [2].",
].join("\n");

export async function generateAnswer(chunks: string[], question: string): Promise<string> {
  if (!chunks.length) {
    return "The chapter does not cover this topic.";
  }

  const excerpts = chunks
    .map((chunk, i) => "[" + (i + 1) + "] " + chunk)
    .join("\n\n");

  const userPrompt = [
    "Chapter excerpts:",
    excerpts,
    "",
    "Question: " + question,
    "",
    "Answer:",
  ].join("\n");

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: GROQ_TEMPERATURE,
      max_tokens: GROQ_MAX_TOKENS,
    });

    const answer = completion.choices[0]?.message?.content?.trim();
    if (!answer) return "Failed to generate answer. Please try again.";
    return answer;
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error("Failed to generate answer from LLM");
  }
}

export async function* generateAnswerStream(
  chunks: string[],
  question: string
): AsyncGenerator<string> {
  if (!chunks.length) {
    yield "The chapter does not cover this topic.";
    return;
  }

  const excerpts = chunks
    .map((chunk, i) => "[" + (i + 1) + "] " + chunk)
    .join("\n\n");

  const userPrompt = [
    "Chapter excerpts:",
    excerpts,
    "",
    "Question: " + question,
    "",
    "Answer:",
  ].join("\n");

  try {
    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: GROQ_TEMPERATURE,
      max_tokens: GROQ_MAX_TOKENS,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  } catch (error) {
    console.error("Groq streaming error:", error);
    throw new Error("Failed to stream answer");
  }
}
