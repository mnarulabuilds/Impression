import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DIFFICULTY_LEVELS,
  getAllCategories,
  getCategoryDescription,
  getCategoryDisplayName,
  getCategoryIcon,
  getCategoryQuestionCount,
  getDifficultyColor,
  getDifficultyLabel,
  getQuestionById,
  getQuestionCountByDifficulty,
  getQuestionsByCategory,
  getQuestionsByDifficulty,
  getRandomQuestion,
  getTimeLimitDisplay,
  QUESTION_BANK,
  QUESTION_CATEGORIES,
} from "../config/qnaQuestions";

describe("question bank helpers", () => {
  afterEach(() => vi.restoreAllMocks());

  it("filters questions by category and difficulty, including unknown categories", () => {
    const science = getQuestionsByCategory(QUESTION_CATEGORIES.SCIENCE);
    expect(science.length).toBeGreaterThan(0);
    expect(getQuestionsByCategory("unknown" as never)).toEqual([]);
    expect(getQuestionsByDifficulty(DIFFICULTY_LEVELS.BEGINNER).every(
      (question) => question.difficulty === DIFFICULTY_LEVELS.BEGINNER,
    )).toBe(true);
    expect(getQuestionsByDifficulty(
      DIFFICULTY_LEVELS.ADVANCED,
      QUESTION_CATEGORIES.SCIENCE,
    ).every((question) => question.difficulty === DIFFICULTY_LEVELS.ADVANCED)).toBe(true);
    expect(getQuestionCountByDifficulty(DIFFICULTY_LEVELS.BEGINNER)).toBeGreaterThan(0);
    expect(getQuestionCountByDifficulty(
      DIFFICULTY_LEVELS.BEGINNER,
      QUESTION_CATEGORIES.SCIENCE,
    )).toBeGreaterThan(0);
  });

  it("looks up question IDs and chooses random questions with optional filters", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const firstScience = getQuestionsByCategory(QUESTION_CATEGORIES.SCIENCE)[0];
    expect(getQuestionById(firstScience.id)).toEqual(firstScience);
    expect(getQuestionById("missing")).toBeUndefined();
    expect(getRandomQuestion(QUESTION_CATEGORIES.SCIENCE)).toEqual(firstScience);
    expect(getRandomQuestion(
      QUESTION_CATEGORIES.SCIENCE,
      DIFFICULTY_LEVELS.BEGINNER,
    )?.difficulty).toBe(DIFFICULTY_LEVELS.BEGINNER);
    expect(getRandomQuestion(
      "unknown" as never,
      DIFFICULTY_LEVELS.BEGINNER,
    )).toBeNull();
    expect(getAllCategories()).toEqual(Object.keys(QUESTION_BANK));
  });

  it("provides category and difficulty labels with fallbacks", () => {
    expect(getCategoryQuestionCount(QUESTION_CATEGORIES.SCIENCE)).toBe(
      QUESTION_BANK.science.length,
    );
    expect(getCategoryQuestionCount(
      QUESTION_CATEGORIES.SCIENCE,
      DIFFICULTY_LEVELS.BEGINNER,
    )).toBeGreaterThan(0);
    expect(getCategoryIcon(QUESTION_CATEGORIES.SCIENCE)).toBe("🔬");
    expect(getCategoryIcon("unknown" as never)).toBe("📚");
    expect(getCategoryDisplayName(QUESTION_CATEGORIES.BUSINESS)).toBe("Business & Economics");
    expect(getCategoryDisplayName("unknown" as never)).toBe("unknown");
    expect(getCategoryDescription(QUESTION_CATEGORIES.TECHNOLOGY)).toContain("computing");
    expect(getCategoryDescription("unknown" as never)).toContain("various topics");
    expect(getDifficultyColor(DIFFICULTY_LEVELS.BEGINNER)).toBe("#10b981");
    expect(getDifficultyColor("unknown" as never)).toBe("#6b7280");
    expect(getDifficultyLabel(DIFFICULTY_LEVELS.ADVANCED)).toBe("Advanced");
    expect(getDifficultyLabel("unknown" as never)).toBe("unknown");
  });

  it("formats time limits with singular and plural units", () => {
    expect(getTimeLimitDisplay(60)).toBe("1 min");
    expect(getTimeLimitDisplay(180)).toBe("3 mins");
  });
});
