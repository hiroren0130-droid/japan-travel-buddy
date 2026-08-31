import "server-only";

import { redirect } from "next/navigation";

import {
  AdminWhitelistConfigurationError,
  normalizeEmail,
  parseAdminEmailWhitelist,
} from "@/lib/auth/admin-whitelist";
import { getVerifiedSession } from "@/lib/auth/session";

export { AdminWhitelistConfigurationError };

export type AdminSession = {
  uid: string;
  email: string;
};

export function getAdminEmailWhitelist(): ReadonlySet<string> {
  return parseAdminEmailWhitelist(process.env.ADMIN_EMAILS);
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmailWhitelist().has(normalizeEmail(email));
}

export async function requireAdminSession(
  requestedPath = "/admin"
): Promise<AdminSession> {
  const session = await getVerifiedSession();

  if (!session) {
    const nextPath = requestedPath.startsWith("/admin")
      ? requestedPath
      : "/admin";

    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const email = session.email ? normalizeEmail(session.email) : "";

  if (
    !session.uid ||
    !email ||
    session.email_verified !== true ||
    !isAdminEmail(email)
  ) {
    redirect("/admin/forbidden");
  }

  return {
    uid: session.uid,
    email,
  };
}
