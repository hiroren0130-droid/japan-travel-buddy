import "server-only";

import { isAdminEmail } from "@/lib/auth/admin";
import { getVerifiedSession } from "@/lib/auth/session";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { createVercelBillingDiagnostic } from "./handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const diagnose = createVercelBillingDiagnostic({
  getSession: getVerifiedSession,
  isAdminEmail,
  isSameOrigin: isSameOriginRequest,
  fetch: (input, init) => globalThis.fetch(input, init),
  env: process.env,
});

export async function POST(request: Request) {
  return diagnose(request);
}

export async function GET() {
  return new Response(null, {
    status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
