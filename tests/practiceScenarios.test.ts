import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAllScenarioIds,
  getScenario,
  getScenarioFeedback,
  PRACTICE_SCENARIOS,
} from "../config/practiceScenarios";

describe("practice scenarios", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns known scenarios and falls back to the job interview scenario", () => {
    expect(getAllScenarioIds()).toEqual(Object.keys(PRACTICE_SCENARIOS));
    expect(getScenario("elevator-pitch").duration).toBe(90);
    expect(getScenario("unknown")).toBe(PRACTICE_SCENARIOS["job-interview"]);
  });

  it.each([
    [85, "excellent"],
    [70, "good"],
    [69, "needsImprovement"],
  ] as const)("selects the %s score feedback tier", (score, tier) => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const feedback = getScenarioFeedback("networking", score);
    expect(PRACTICE_SCENARIOS.networking.feedbackTemplates[tier]).toContain(feedback);
  });
});
