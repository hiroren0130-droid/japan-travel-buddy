import { NextResponse } from "next/server";

import {
  getAdminSessionCookieName,
  getExpiredAdminSessionCookieOptions,
} from "@/lib/auth/cookies";
import { isSameOriginRequest } from "@/lib/auth/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return new NextResponse(null, {
      status: 403,
      headers: NO_STORE_HEADERS,
    });
  }

  const response = new NextResponse(null, {
    status: 204,
    headers: NO_STORE_HEADERS,
  });
  response.cookies.set(
    getAdminSessionCookieName(),
    "",
    getExpiredAdminSessionCookieOptions()
  );

  return response;
}
