import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearFavorites,
  clearProgressHistory,
  exportProgressHistory,
  getFavoriteEntries,
  getFavorites,
  getProgressHistory,
  getProgressStats,
  getRecentEntries,
  isFavorite,
  saveProgressEntry,
  toggleFavorite,
} from "../utils/progressStorage";

const HISTORY_KEY = "impression_progress_history";
const FAVORITES_KEY = "impression_favorites";

const installStorage = () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
  vi.stubGlobal("localStorage", storage);
  return storage;
};

const saveHistory = (history: Record<string, unknown>[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

describe("progress storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    installStorage();
  });

  it("reads empty and saved history, falling back for malformed storage", () => {
    expect(getProgressHistory()).toEqual([]);
    saveHistory([{ id: "one", score: 80 }]);
    expect(getProgressHistory()).toEqual([{ id: "one", score: 80 }]);

    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(HISTORY_KEY, "{bad json");
    expect(getProgressHistory()).toEqual([]);
    expect(error).toHaveBeenCalled();
  });

  it("saves normalized entries, blocks recent duplicates, and caps history", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const entry = saveProgressEntry({ transcript: "  hello  ", score: 0 });
    expect(entry).toMatchObject({
      id: "1700000000000",
      sentiment: "neutral",
      transcript: "  hello  ",
      score: 0,
      feedback: "",
      analysis: null,
    });
    expect(saveProgressEntry({ transcript: "  hello  " })).toBeNull();
    expect(saveProgressEntry({ transcript: "   " })).not.toBeNull();

    saveHistory(Array.from({ length: 205 }, (_, index) => ({
      id: String(index),
      timestamp: index,
      transcript: "",
      score: index,
    })));
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_100_000);
    saveProgressEntry({ transcript: "new" });
    expect(getProgressHistory()).toHaveLength(200);
    expect(getProgressHistory()[0].transcript).toBe("new");
  });

  it("clears history and computes statistics for empty and populated data", () => {
    expect(getProgressStats()).toMatchObject({
      totalEntries: 0,
      averageScore: 0,
      recentTrend: "neutral",
      scoreHistory: [],
    });
    saveHistory([
      { id: "a", timestamp: 1_700_000_000_000, score: 80, sentiment: "positive" },
      { id: "b", timestamp: 1_700_000_001_000, score: 60, sentiment: "negative" },
      { id: "c", timestamp: 1_700_000_002_000, score: 0 },
    ]);
    expect(getProgressStats()).toMatchObject({
      totalEntries: 3,
      averageScore: 70,
      highestScore: 80,
      lowestScore: 60,
      recentTrend: "improving",
      sentimentDistribution: { positive: 1, negative: 1, neutral: 1, mixed: 0 },
    });
    expect(getProgressStats().entriesByDate).toHaveLength(1);
    expect(clearProgressHistory()).toBe(true);
    expect(getProgressHistory()).toEqual([]);
  });

  it("filters recent entries using the requested lookback window", () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    saveHistory([
      { timestamp: now, score: 90 },
      { timestamp: now - 2 * 86_400_000, score: 70 },
      { timestamp: now - 10 * 86_400_000, score: 50 },
    ]);
    expect(getRecentEntries(3)).toHaveLength(2);
  });

  it("exports CSV with escaped fields and summary statistics", () => {
    expect(exportProgressHistory()).toBeNull();
    saveHistory([{
      timestamp: 1_700_000_000_000,
      score: 82,
      sentiment: "positive",
      transcript: 'hello, "world"',
      feedback: "speak clearly\nnext time",
      analysis: { fillerWords: 2, pace: 140, vocabulary: 75, repetition: 1, suggestions: 3 },
    }]);
    const csv = exportProgressHistory();
    expect(csv).toContain('"hello, ""world"""');
    expect(csv).toContain('"speak clearly\nnext time"');
    expect(csv).toContain("Summary Statistics");
    expect(csv).toContain("Average Score,82");
  });

  it("manages favorites and returns matching entries in newest-first order", () => {
    expect(getFavorites()).toEqual([]);
    saveHistory([
      { id: "older", timestamp: 100, score: 60 },
      { id: "newer", timestamp: 200, score: 90 },
    ]);
    expect(toggleFavorite("older")).toBe(true);
    expect(isFavorite("older")).toBe(true);
    expect(toggleFavorite("newer")).toBe(true);
    expect(getFavoriteEntries().map((entry) => entry.id)).toEqual(["newer", "older"]);
    expect(toggleFavorite("older")).toBe(false);
    expect(isFavorite("older")).toBe(false);
    expect(clearFavorites()).toBe(true);
    expect(getFavoriteEntries()).toEqual([]);
  });

  it("handles malformed favorite storage safely", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(FAVORITES_KEY, "not-json");
    expect(getFavorites()).toEqual([]);
    expect(isFavorite("id")).toBe(false);
    expect(error).toHaveBeenCalled();
  });
});
