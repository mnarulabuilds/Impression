import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "config/appEnvironment.ts",
        "utils/advancedAnalytics.ts",
        "utils/nlpAnalysis.ts",
        "utils/progressStorage.ts",
        "utils/qnaEvaluation.ts",
        "config/languageConfig.ts",
        "config/practiceScenarios.ts",
        "config/qnaQuestions.ts",
      ],
      reporter: ["text", "lcov", "json-summary"],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
});
