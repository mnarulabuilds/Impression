import { describe, expect, it } from "vitest";
import {
  analyzePace,
  analyzeSentenceStructure,
  analyzeSentiment,
  analyzeText,
  analyzeVocabulary,
  detectFillerWords,
  detectRepetition,
  generateSuggestions,
} from "../utils/nlpAnalysis";

describe("speech analysis", () => {
  it("detects filler words, including multi-word and language-specific phrases", () => {
    expect(detectFillerWords("")).toMatchObject({ count: 0, percentage: 0 });
    expect(detectFillerWords("Um, you know, I mean, the answer is clear.")).toMatchObject({
      count: 3,
      breakdown: { um: 1, "you know": 1, "i mean": 1 },
    });
    expect(detectFillerWords("Este, la respuesta es clara.", "es").count).toBe(1);
    expect(detectFillerWords("hello", "unknown").count).toBe(0);
  });

  it("analyzes sentence length and repetition, with empty-input defaults", () => {
    expect(analyzeSentenceStructure("   ")).toMatchObject({ sentenceCount: 0, avgLength: 0 });
    expect(analyzeSentenceStructure("Short sentence. This one has several additional words for detail."))
      .toMatchObject({ sentenceCount: 2, avgLength: 5 });
    expect(detectRepetition("")).toMatchObject({ count: 0 });
    expect(detectRepetition("clarity clarity clarity focus focus focus focus"))
      .toMatchObject({ count: 2, severity: "medium" });
    expect(detectRepetition("signal signal signal signal signal signal signal"))
      .toMatchObject({ repeatedWords: [{ word: "signal", count: 7 }] });
  });

  it("measures vocabulary and speaking pace across empty, estimated, and timed input", () => {
    expect(analyzeVocabulary("")).toMatchObject({ totalWords: 0, diversity: 0 });
    expect(analyzeVocabulary("Clear language improves clear communication.")).toMatchObject({
      totalWords: 5,
      uniqueWords: 4,
    });
    expect(analyzePace("", 10)).toMatchObject({ wordCount: 0, pace: "normal" });
    expect(analyzePace("one two three", 1)).toMatchObject({
      wordsPerMinute: 180,
      pace: "fast",
    });
    expect(analyzePace("one two three", 0.5).pace).toBe("too-fast");
    expect(analyzePace("one two three four five six seven eight nine ten eleven", 6).pace).toBe("slow");
    expect(analyzePace("one two three four five six seven eight", 10).pace).toBe("too-slow");
    expect(analyzePace("one two three").estimatedDuration).toBe(1);
  });

  it("returns sentiment results and safe defaults for empty full analyses", () => {
    expect(analyzeSentiment("A clear and positive answer.")).toHaveProperty("label");
    expect(analyzeText("  ", null, "fr")).toMatchObject({
      language: "fr",
      sentiment: { label: "neutral" },
      suggestions: [],
      overallScore: 0,
    });
  });

  it("builds full analysis and generates feedback for measurable delivery issues", () => {
    const result = analyzeText(
      `${"um ".repeat(8)}The clarity clarity clarity clarity clarity clarity is useful and clear.`,
      1,
    );
    expect(result).toHaveProperty("overallScore");
    expect(result.fillerWords.count).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
    const suggestions = generateSuggestions({
      fillerWords: { count: 5, severity: "high" },
      repetition: { count: 1, repeatedWords: [{ word: "clear" }] },
      sentenceStructure: { variety: "low", sentenceCount: 3, avgLength: 30 },
      pace: { pace: "too-fast", wordsPerMinute: 200 },
      vocabulary: { diversity: 20, totalWords: 30 },
    });
    expect(suggestions.map((item) => item.type)).toEqual([
      "filler-words", "repetition", "sentence-variety", "sentence-length", "pace", "vocabulary",
    ]);
    expect(generateSuggestions({
      fillerWords: { count: 1, severity: "medium" },
      repetition: { count: 0 },
      sentenceStructure: { variety: "high", sentenceCount: 1, avgLength: 10 },
      pace: { pace: "too-slow", wordsPerMinute: 80 },
      vocabulary: { diversity: 80, totalWords: 10 },
    })[0].priority).toBe("medium");
  });
});
