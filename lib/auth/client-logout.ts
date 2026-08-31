export async function clearAdminSession(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}
