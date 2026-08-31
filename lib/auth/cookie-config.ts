export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
export const ADMIN_SESSION_EXPIRES_IN_MS =
  ADMIN_SESSION_MAX_AGE_SECONDS * 1000;

const PRODUCTION_COOKIE_NAME = "__Host-jtb-admin-session";
const DEVELOPMENT_COOKIE_NAME = "jtb-admin-session";

export function getAdminSessionCookieConfig(isProduction: boolean) {
  return {
    name: isProduction ? PRODUCTION_COOKIE_NAME : DEVELOPMENT_COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    },
  };
}
