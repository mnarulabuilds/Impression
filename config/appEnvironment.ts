export const APP_ENVIRONMENTS = ["development", "staging", "production"] as const;
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

export const resolveAppEnvironment = (
  configuredValue: string | undefined,
  nodeEnvironment: string | undefined,
): AppEnvironment => {
  const configuredEnvironment = configuredValue?.trim().toLowerCase();
  if (
    configuredEnvironment &&
    !APP_ENVIRONMENTS.includes(configuredEnvironment as AppEnvironment)
  ) {
    throw new Error(
      `Invalid NEXT_PUBLIC_APP_ENV "${configuredEnvironment}". Expected development, staging, or production.`,
    );
  }
  if (configuredEnvironment) return configuredEnvironment as AppEnvironment;
  return nodeEnvironment === "production" ? "production" : "development";
};

export const APP_ENV = resolveAppEnvironment(
  process.env.NEXT_PUBLIC_APP_ENV,
  process.env.NODE_ENV,
);

export const isMockEnvironment = APP_ENV !== "production";

export const DEMO_CREDENTIALS = {
  email: "demo@impression.local",
  password: "ImpressionDemo2026!",
} as const;
