import "server-only";

import { isAdminEmail } from "@/lib/auth/admin";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { getVerifiedSession } from "@/lib/auth/session";
import { getGitHubProductionMonthlyCost } from "@/lib/costs/githubBillingTransport";
import { getUtcMonth } from "@/lib/costs/openaiCostProvider";
import { createDiagnosticHandler } from "./handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const diagnose = createDiagnosticHandler({
  getSession: getVerifiedSession,
  isAdminEmail,
  isSameOrigin: isSameOriginRequest,
  currentMonth: () => getUtcMonth(new Date()),
  getCost: getGitHubProductionMonthlyCost,
});

export async function POST(request: Request) {
  return diagnose(request);
}

export async function GET() {
  return new Response(null, {
    status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
