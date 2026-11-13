import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  compareEntries,
  getBestPerformances,
  getCalendarHeatmapData,
  getFillerWordsAnalysis,
  getImprovementMetrics,
  getPaceTrends,
  getPracticeStreaks,
  getTimeSeriesData,
  getVocabularyTrends,
} from "../utils/advancedAnalytics";

const HISTORY_KEY = "impression_progress_history";
const DAY = 86_400_000;

const setHistory = (history: Record<string, unknown>[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

const makeStorage = () => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  });
};

describe("advanced progress analytics", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00.000Z"));
    makeStorage();
  });

  it("returns empty analytics for an empty history", () => {
    expect(getTimeSeriesData()).toEqual([]);
    expect(getVocabularyTrends()).toEqual([]);
    expect(getPaceTrends()).toEqual([]);
    expect(getFillerWordsAnalysis()).toMatchObject({ trends: [], total: 0, average: 0, improvement: 0 });
    expect(getImprovementMetrics()).toBeNull();
    expect(getPracticeStreaks()).toEqual({ current: 0, longest: 0 });
    expect(getBestPerformances()).toEqual([]);
    expect(compareEntries("a", "b")).toBeNull();
  });

  it("groups practice data by day, week, month, and falls back for unknown periods", () => {
    setHistory([
      { timestamp: Date.now(), score: 80, sentiment: "positive", transcript: "one two three" },
      { timestamp: Date.now() - DAY, score: 60, sentiment: "negative", transcript: "four five" },
      { timestamp: Date.now() - 50 * DAY, score: 0 },
    ]);
    expect(getTimeSeriesData("day")).toHaveLength(2);
    expect(getTimeSeriesData("week")).toHaveLength(3);
    expect(getTimeSeriesData("month")).toHaveLength(2);
    expect(getTimeSeriesData("unknown")).toHaveLength(2);
    expect(getTimeSeriesData("day")[0]).toMatchObject({
      practices: 1,
      avgScore: 80,
      avgWords: 3,
      positiveCount: 1,
    });
  });

  it("creates a 12-week heatmap and derives vocabulary and pace trends", () => {
    setHistory([
      { timestamp: Date.now(), score: 80, transcript: "Clear clear language", analysis: { pace: 140 } },
      { timestamp: Date.now() - DAY, score: 60, transcript: "", analysis: { pace: 190 } },
      { timestamp: Date.now() - 100 * DAY, score: 100, transcript: "outside window", analysis: { pace: 0 } },
    ]);
    const heatmap = getCalendarHeatmapData();
    expect(heatmap).toHaveLength(12);
    expect(heatmap.flat()).toHaveLength(84);
    expect(getVocabularyTrends()).toHaveLength(3);
    expect(getVocabularyTrends().at(-1)).toMatchObject({
      diversity: 67,
      wordCount: 3,
    });
    expect(getPaceTrends()).toHaveLength(2);
    expect(getPaceTrends()[0].optimal).toBe(false);
    expect(getPaceTrends()[1].optimal).toBe(true);
  });

  it("summarizes filler-word trends and handles zero baseline improvement", () => {
    setHistory([
      { timestamp: 4, analysis: { fillerWords: 8 } },
      { timestamp: 3, analysis: { fillerWords: 6 } },
      { timestamp: 2, analysis: { fillerWords: 4 } },
      { timestamp: 1, analysis: { fillerWords: 2 } },
    ]);
    expect(getFillerWordsAnalysis()).toMatchObject({
      total: 20,
      average: 5,
      improvement: -133,
    });
    setHistory([{ timestamp: 1, analysis: { fillerWords: 0 } }]);
    expect(getFillerWordsAnalysis().improvement).toBe(0);
  });

  it("compares entries and reports score, vocabulary, and filler changes", () => {
    setHistory([
      {
        id: "first",
        timestamp: Date.now() - DAY,
        score: 60,
        sentiment: "neutral",
        transcript: "one two",
        analysis: { fillerWords: 5, pace: 110, vocabulary: 40 },
      },
      {
        id: "second",
        timestamp: Date.now(),
        score: 80,
        sentiment: "positive",
        transcript: "one two three",
        analysis: { fillerWords: 2, pace: 150, vocabulary: 65 },
      },
    ]);
    expect(compareEntries("first", "second")).toMatchObject({
      entry1: { wordCount: 2, fillerWords: 5 },
      entry2: { wordCount: 3, pace: 150 },
      improvements: { score: 20, fillerWords: 3, vocabulary: 25 },
    });
    expect(compareEntries("missing", "second")).toBeNull();
  });

  it("computes improvement metrics when enough history is available", () => {
    expect(getImprovementMetrics()).toBeNull();
    setHistory(Array.from({ length: 20 }, (_, index) => ({
      id: String(index),
      timestamp: Date.now() - index * DAY,
      score: index < 10 ? 80 : 50,
      analysis: { fillerWords: index < 10 ? 2 : 6 },
    })));
    expect(getImprovementMetrics()).toMatchObject({
      scoreImprovement: 60,
      fillerWordsReduction: 67,
      totalPractices: 20,
      recentPractices: 10,
      consistencyScore: 100,
    });
  });

  it("calculates current and longest streaks and returns best performances", () => {
    const today = Date.now();
    setHistory([
      { id: "today", timestamp: today, score: 70, transcript: "today" },
      { id: "yesterday", timestamp: today - DAY, score: 90, transcript: "yesterday" },
      { id: "older", timestamp: today - 2 * DAY, score: 85, transcript: "x".repeat(120) },
      { id: "gap", timestamp: today - 5 * DAY, score: 0, transcript: "" },
    ]);
    expect(getPracticeStreaks()).toEqual({ current: 3, longest: 3 });
    expect(getBestPerformances(2).map((entry) => entry.id)).toEqual(["yesterday", "older"]);
    expect(getBestPerformances(2)[1].transcript).toHaveLength(103);
  });
});
