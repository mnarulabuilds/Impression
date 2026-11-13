import { describe, expect, it } from "vitest";
import {
  calculateWeightedScore,
  evaluateAnswer,
  evaluateClarity,
  evaluateCompleteness,
  evaluateKeywords,
  evaluateVocabulary,
  generateQnASuggestions,
  getScoreGrade,
} from "../utils/qnaEvaluation";

describe("Q&A answer evaluation", () => {
  it("matches complete keywords case-insensitively and reports missing terms", () => {
    expect(evaluateKeywords("AI helps teams", ["AI", "team", "ML"])).toMatchObject({
      score: 33,
      matchedKeywords: ["AI"],
      missingKeywords: ["team", "ML"],
      totalKeywords: 3,
    });
    expect(evaluateKeywords("", ["AI"])).toMatchObject({
      score: 0,
      missingKeywords: ["AI"],
    });
    expect(evaluateKeywords("paid work", ["AI"]).score).toBe(0);
  });

  it("scores answer completeness for empty, short, ideal, and long responses", () => {
    expect(evaluateCompleteness("", 10).status).toBe("too-short");
    expect(evaluateCompleteness("one two", 10).status).toBe("too-short");
    expect(evaluateCompleteness("one two three four five six seven eight", 10)).toMatchObject({
      score: 100,
      status: "optimal",
      wordCount: 8,
    });
    expect(evaluateCompleteness("one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen", 10)).toMatchObject({
      score: 85,
      status: "too-long",
    });
  });

  it("evaluates clarity penalties and vocabulary levels", () => {
    expect(evaluateClarity(null)).toEqual({ score: 0, issues: ["Analysis unavailable"] });
    expect(evaluateClarity({
      fillerWords: { percentage: 11 },
      repetition: { count: 4 },
      sentenceStructure: { avgLength: 31, sentenceCount: 1, variety: "high" },
    })).toMatchObject({ score: 45 });
    expect(evaluateClarity({
      fillerWords: { percentage: 6 },
      repetition: { count: 2 },
      sentenceStructure: { avgLength: 5, sentenceCount: 4, variety: "low" },
    })).toMatchObject({ score: 65 });

    expect(evaluateVocabulary(null).score).toBe(0);
    expect(evaluateVocabulary({ vocabulary: { diversity: 72, complexity: "high" } })).toMatchObject({
      score: 100,
      diversity: 72,
    });
    expect(evaluateVocabulary({ vocabulary: { diversity: 65, complexity: "low" } }).score).toBe(85);
    expect(evaluateVocabulary({ vocabulary: { diversity: 55, complexity: "medium" } }).score).toBe(70);
    expect(evaluateVocabulary({ vocabulary: { diversity: 20, complexity: "low" } }).score).toBe(50);
  });

  it("calculates weighted scores and gives score grades at each threshold", () => {
    expect(calculateWeightedScore(null as never, {} as never)).toBe(0);
    expect(calculateWeightedScore(
      { accuracy: 80, clarity: 70, completeness: 90, vocabulary: 60 },
      { accuracy: 0.25, clarity: 0.25, completeness: 0.25, vocabulary: 0.25 },
    )).toBe(75);
    expect([95, 85, 75, 65, 55, 45].map((score) => getScoreGrade(score).grade)).toEqual([
      "A+", "A", "B", "C", "D", "F",
    ]);
  });

  it("generates actionable suggestions for weak answer dimensions", () => {
    const suggestions = generateQnASuggestions({
      keywordAnalysis: { percentage: 40, missingKeywords: ["clarity", "focus"] },
      completenessAnalysis: { status: "too-short", expectedLength: 50, wordCount: 10 },
      clarityAnalysis: { issues: ["Use shorter sentences"] },
      vocabularyAnalysis: { diversity: 40 },
    });
    expect(suggestions.map((suggestion) => suggestion.type)).toEqual([
      "keywords", "completeness", "clarity", "vocabulary",
    ]);
    expect(generateQnASuggestions({
      keywordAnalysis: { percentage: 60, missingKeywords: ["accuracy"] },
      completenessAnalysis: { status: "too-long" },
      clarityAnalysis: { issues: [] },
      vocabularyAnalysis: { diversity: 80 },
    }).map((suggestion) => suggestion.type)).toEqual(["keywords", "completeness"]);
  });

  it("evaluates a complete answer and returns null for missing input", () => {
    expect(evaluateAnswer("", { keywords: [] })).toBeNull();
    const result = evaluateAnswer(
      "Photosynthesis helps plants use sunlight to create glucose and oxygen.",
      {
        id: "sci_001",
        category: "science",
        difficulty: "beginner",
        keywords: ["plants", "sunlight", "glucose", "oxygen"],
        expectedLength: 12,
        evaluationCriteria: {
          accuracy: 0.25,
          clarity: 0.25,
          completeness: 0.25,
          vocabulary: 0.25,
        },
      },
      20,
    );
    expect(result).toMatchObject({ questionId: "sci_001", category: "science" });
    expect(result.scores.accuracy).toBe(100);
    expect(result.timestamp).toBeTruthy();
  });
});
