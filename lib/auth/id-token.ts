export const MAX_AUTH_AGE_SECONDS = 5 * 60;

export function hasRecentAuthentication(
  authTime: unknown,
  nowSeconds = Math.floor(Date.now() / 1000)
): authTime is number {
  if (
    typeof authTime !== "number" ||
    !Number.isSafeInteger(authTime) ||
    authTime <= 0 ||
    authTime > nowSeconds
  ) {
    return false;
  }

  return nowSeconds - authTime <= MAX_AUTH_AGE_SECONDS;
}
