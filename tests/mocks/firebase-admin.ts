type MockDecodedToken = {
  uid: string;
  email?: string;
  email_verified?: boolean;
  auth_time?: unknown;
};

export class FirebaseAdminConfigurationError extends Error {
  constructor() {
    super("Firebase Admin configuration is invalid.");
    this.name = "FirebaseAdminConfigurationError";
  }
}

const decodedTokens: Record<string, MockDecodedToken> = {
  "mock-admin-token": {
    uid: "admin-user",
    email: "admin@example.com",
    email_verified: true,
  },
  "mock-user-token": {
    uid: "regular-user",
    email: "traveler@example.com",
    email_verified: true,
  },
  "mock-unverified-token": {
    uid: "unverified-user",
    email: "admin@example.com",
    email_verified: false,
  },
};

const decodedSessions: Record<string, MockDecodedToken> = {
  "mock-admin-session": decodedTokens["mock-admin-token"],
  "mock-user-session": decodedTokens["mock-user-token"],
};

const mockAuth = {
  async verifyIdToken(token: string): Promise<MockDecodedToken> {
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (token === "mock-admin-token-missing-whitelist") {
      const originalWhitelist = process.env.ADMIN_EMAILS;
      delete process.env.ADMIN_EMAILS;

      setTimeout(() => {
        if (originalWhitelist === undefined) {
          delete process.env.ADMIN_EMAILS;
        } else {
          process.env.ADMIN_EMAILS = originalWhitelist;
        }
      }, 0);

      return {
        ...decodedTokens["mock-admin-token"],
        auth_time: nowSeconds,
      };
    }

    if (
      token === "mock-invalid-token" ||
      token === "mock-expired-token" ||
      token === "mock-revoked-token"
    ) {
      throw new Error("Mock ID token verification failed.");
    }

    const decodedToken = decodedTokens[token];

    if (!decodedToken) {
      const adminToken = decodedTokens["mock-admin-token"];

      switch (token) {
        case "mock-auth-time-missing":
          return { ...adminToken };
        case "mock-auth-time-malformed":
          return { ...adminToken, auth_time: "invalid" };
        case "mock-auth-time-future":
          return { ...adminToken, auth_time: nowSeconds + 1 };
        case "mock-auth-time-expired":
          return { ...adminToken, auth_time: nowSeconds - 301 };
        case "mock-auth-time-boundary":
          return {
            ...adminToken,
            get auth_time() {
              return Math.floor(Date.now() / 1000) - 300;
            },
          };
        case "mock-auth-time-recent":
          return { ...adminToken, auth_time: nowSeconds };
        default:
          throw new Error("Unknown mock ID token.");
      }
    }

    return {
      ...decodedToken,
      auth_time: nowSeconds,
    };
  },

  async createSessionCookie(token: string): Promise<string> {
    if (
      token !== "mock-admin-token" &&
      token !== "mock-auth-time-recent" &&
      token !== "mock-auth-time-boundary"
    ) {
      throw new Error("Mock session creation failed.");
    }

    return "mock-admin-session";
  },

  async verifySessionCookie(sessionCookie: string): Promise<MockDecodedToken> {
    if (sessionCookie === "mock-revoked-session") {
      throw new Error("Mock session was revoked.");
    }

    const decodedToken = decodedSessions[sessionCookie];

    if (!decodedToken) {
      throw new Error("Unknown mock session.");
    }

    return decodedToken;
  },
};

export function getFirebaseAdminAuth() {
  return mockAuth;
}
