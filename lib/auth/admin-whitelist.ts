const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AdminWhitelistConfigurationError extends Error {
  constructor() {
    super("Admin whitelist configuration is invalid.");
    this.name = "AdminWhitelistConfigurationError";
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseAdminEmailWhitelist(
  rawValue: string | undefined
): ReadonlySet<string> {
  if (!rawValue?.trim()) {
    throw new AdminWhitelistConfigurationError();
  }

  const entries = rawValue
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);

  if (
    entries.length === 0 ||
    entries.some((email) => !EMAIL_PATTERN.test(email))
  ) {
    throw new AdminWhitelistConfigurationError();
  }

  return new Set(entries);
}
