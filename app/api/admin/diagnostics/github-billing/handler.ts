import "server-only";

import type { GitHubCostOptions, GitHubCostResult } from "@/lib/costs/githubCostProvider";

type Dependencies = {
  getSession: () => Promise<{ uid: string; email?: string; email_verified?: boolean } | null>;
  isAdminEmail: (email: string) => boolean;
  isSameOrigin: (request: Request) => boolean;
  currentMonth: () => string;
  getCost: (options: GitHubCostOptions) => Promise<GitHubCostResult>;
};
type Failure = "config" | "auth" | "permission" | "not_found" | "rate_limit" | "api" | "timeout" | "internal";
const reply = (body: object, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "no-store" },
});
const fail = (status: Failure, httpStatus: number) => reply({ ok: false, status }, httpStatus);

/** Temporary diagnostic: no body/query input, no logs, no raw provider result. */
export function createDiagnosticHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return new Response(null, {
      status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" },
    });
    try {
      if (!deps.isSameOrigin(request)) return fail("permission", 403);
      const session = await deps.getSession();
      if (!session) return fail("auth", 401);
      if (!session.uid || !session.email || session.email_verified !== true || !deps.isAdminEmail(session.email)) {
        return fail("permission", 403);
      }
      const result = await deps.getCost({ reportingMonth: deps.currentMonth(), maxAttempts: 1 });
      if (result.fetchStatus === "fallback") return fail("config", 503);
      if (result.fetchStatus === "error") {
        if (result.reason === "timeout") return fail("timeout", 504);
        if (result.reason === "rate_limited" || result.httpStatus === 429) return fail("rate_limit", 429);
        if (result.httpStatus === 401) return fail("auth", 502);
        if (result.httpStatus === 403) return fail("permission", 502);
        if (result.httpStatus === 404) return fail("not_found", 502);
        return fail(result.reason === "invalid_month" ? "internal" : "api", 502);
      }
      return reply({
        ok: true,
        status: result.fetchStatus,
        dataState: result.fetchStatus === "empty" ? "empty" : "available",
        recordCount: result.usage.length,
        targetRepositoryRecordCount: result.usage.filter((item) => item.attribution === "project").length,
        otherRepositoryRecordCount: result.usage.filter((item) => item.attribution === "other_repository").length,
        unscopedRecordCount: result.usage.filter((item) => item.attribution === "unattributed").length,
        // null preserves unknown currency; no amount or repository name is returned.
        currencies: [...new Set(result.usage.map((item) => item.currency))],
      });
    } catch {
      return fail("internal", 500);
    }
  };
}
