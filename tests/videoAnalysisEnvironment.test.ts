import { afterEach, describe, expect, it, vi } from "vitest";

describe("video analysis environment guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("allows simulated video analysis in development and rejects it in production", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development");
    vi.resetModules();
    const development = await import("../utils/videoAnalysis");
    await expect(development.analyzeFacialExpressions(undefined)).resolves.toMatchObject({
      detected: true,
      faceDetected: true,
    });

    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
    vi.resetModules();
    const production = await import("../utils/videoAnalysis");
    await expect(production.analyzeFacialExpressions(undefined)).rejects.toThrow(
      "Production facial analysis provider is not configured",
    );
    await expect(production.analyzeVideo({} as HTMLVideoElement)).rejects.toThrow(
      "Production video analysis provider is not configured",
    );
  });
});
