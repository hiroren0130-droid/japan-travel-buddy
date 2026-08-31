import "server-only";

import {
  ADMIN_SESSION_EXPIRES_IN_MS,
  getAdminSessionCookieConfig,
} from "@/lib/auth/cookie-config";

export { ADMIN_SESSION_EXPIRES_IN_MS };

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getAdminSessionCookieName(): string {
  return getAdminSessionCookieConfig(isProduction()).name;
}

export function getAdminSessionCookieOptions() {
  return getAdminSessionCookieConfig(isProduction()).options;
}

export function getExpiredAdminSessionCookieOptions() {
  return {
    ...getAdminSessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  };
}
