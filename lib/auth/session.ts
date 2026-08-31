import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { cookies } from "next/headers";

import { getAdminSessionCookieName } from "@/lib/auth/cookies";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

export async function getVerifiedSession(): Promise<DecodedIdToken | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getAdminSessionCookieName())?.value;

  if (!sessionCookie) {
    return null;
  }

  const adminAuth = getFirebaseAdminAuth();

  try {
    return await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}
