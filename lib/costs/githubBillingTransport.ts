import "server-only";

import {
  getGitHubMonthlyCost,
  type GitHubCostOptions,
  type GitHubCostResult,
} from "./githubCostProvider";

/** Pass to getGitHubMonthlyCost({ fetch: githubBillingProductionFetch }).
 * The provider owns the URL, Bearer token, Accept/API-Version headers,
 * no-store/redirect policy, AbortSignal, error classification and retries.
 * Resolve global fetch at invocation time; importing this module does no I/O.
 * Do not log requests, responses or exceptions in this transport.
 */
export const githubBillingProductionFetch: typeof globalThis.fetch = (input, init) =>
  globalThis.fetch(input, init);

/** Explicit production entry point. Missing credentials still fall back before
 * any request. Tests can supply options.fetch instead of the production transport.
 * No route or UI calls this entry point yet.
 */
export function getGitHubProductionMonthlyCost(
  options: GitHubCostOptions = {},
): Promise<GitHubCostResult> {
  return getGitHubMonthlyCost({
    ...options,
    fetch: options.fetch ?? githubBillingProductionFetch,
  });
}
