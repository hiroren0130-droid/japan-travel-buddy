export const FIREBASE_MOCK_SENTINEL = "jtb-deterministic-playwright-v1";

type FirebaseMockModeInput = {
  env: NodeJS.ProcessEnv;
  isDevelopmentServer: boolean;
};

export class FirebaseMockModeConfigurationError extends Error {
  constructor() {
    super(
      "Firebase mocks are restricted to the local deterministic Playwright development server."
    );
    this.name = "FirebaseMockModeConfigurationError";
  }
}

export function resolveFirebaseMockMode({
  env,
  isDevelopmentServer,
}: FirebaseMockModeInput): boolean {
  if (env.PLAYWRIGHT_FIREBASE_MOCKS !== "1") {
    return false;
  }

  const isVercelEnvironment =
    env.VERCEL !== undefined || env.VERCEL_ENV !== undefined;
  const hasExpectedSentinel =
    env.PLAYWRIGHT_FIREBASE_MOCK_SENTINEL === FIREBASE_MOCK_SENTINEL;

  if (
    isVercelEnvironment ||
    !isDevelopmentServer ||
    env.NODE_ENV !== "development" ||
    !hasExpectedSentinel
  ) {
    throw new FirebaseMockModeConfigurationError();
  }

  return true;
}
