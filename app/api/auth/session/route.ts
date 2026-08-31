import { NextResponse } from "next/server";

import {
  AdminWhitelistConfigurationError,
  isAdminEmail,
} from "@/lib/auth/admin";
import {
  ADMIN_SESSION_EXPIRES_IN_MS,
  getAdminSessionCookieName,
  getAdminSessionCookieOptions,
  getExpiredAdminSessionCookieOptions,
} from "@/lib/auth/cookies";
import { hasRecentAuthentication } from "@/lib/auth/id-token";
import { isSameOriginRequest } from "@/lib/auth/origin";
import {
  FirebaseAdminConfigurationError,
  getFirebaseAdminAuth,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ID_TOKEN_LENGTH = 16_384;
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

function emptyResponse(status: number, clearCookie = true): NextResponse {
  const response = new NextResponse(null, {
    status,
    headers: NO_STORE_HEADERS,
  });

  if (clearCookie) {
    response.cookies.set(
      getAdminSessionCookieName(),
      "",
      getExpiredAdminSessionCookieOptions()
    );
  }

  return response;
}

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer ([^\s]+)$/);
  const token = match?.[1];

  if (!token || token.length > MAX_ID_TOKEN_LENGTH) {
    return null;
  }

  return token;
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return emptyResponse(403);
  }

  const idToken = getBearerToken(request);

  if (!idToken) {
    return emptyResponse(400);
  }

  let decodedToken;

  try {
    decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken, true);
  } catch (error) {
    if (error instanceof FirebaseAdminConfigurationError) {
      return emptyResponse(500);
    }

    return emptyResponse(401);
  }

  if (
    !decodedToken.uid ||
    !decodedToken.email ||
    decodedToken.email_verified !== true
  ) {
    return emptyResponse(403);
  }

  if (!hasRecentAuthentication(decodedToken.auth_time)) {
    return emptyResponse(401);
  }

  try {
    if (!isAdminEmail(decodedToken.email)) {
      return emptyResponse(403);
    }
  } catch (error) {
    if (error instanceof AdminWhitelistConfigurationError) {
      return emptyResponse(500);
    }

    return emptyResponse(500);
  }

  let sessionCookie: string;

  try {
    sessionCookie = await getFirebaseAdminAuth().createSessionCookie(idToken, {
      expiresIn: ADMIN_SESSION_EXPIRES_IN_MS,
    });
  } catch {
    return emptyResponse(500);
  }

  const response = emptyResponse(204, false);
  response.cookies.set(
    getAdminSessionCookieName(),
    sessionCookie,
    getAdminSessionCookieOptions()
  );

  return response;
}
