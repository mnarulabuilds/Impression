import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveAppEnvironment } from "../config/appEnvironment";

describe("application environment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each(["development", "staging", "production"] as const)(
    "uses %s as the selected deployment mode",
    async (environment) => {
      vi.stubEnv("NEXT_PUBLIC_APP_ENV", environment);
      vi.resetModules();

      const config = await import("../config/appEnvironment");
      expect(config.APP_ENV).toBe(environment);
      expect(config.isMockEnvironment).toBe(environment !== "production");
    },
  );

  it("defaults from NODE_ENV and rejects unknown modes", () => {
    expect(resolveAppEnvironment(undefined, "production")).toBe("production");
    expect(resolveAppEnvironment("", "development")).toBe("development");
    expect(() => resolveAppEnvironment("preview", "production")).toThrow(
      "Expected development, staging, or production",
    );
  });
});
