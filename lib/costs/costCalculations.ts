import type { MonthlyCostOverview } from "@/types/cost";

function assertValidCost(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${fieldName} must be a finite non-negative number.`);
  }
}

export function calculateCurrentMonthTotal(
  overview: MonthlyCostOverview
): number {
  return overview.services.reduce((total, service) => {
    if (!service.includedInTotal) {
      return total;
    }

    if (service.service === "google-cloud" && service.costs !== undefined) {
      if (service.fetchStatus !== "success" || service.dataState !== "available" ||
          service.billingMonth !== overview.month || overview.reportingCurrency !== "JPY") return total;
      const jpy = service.costs?.find((cost) => cost.currency === "JPY");
      if (!jpy) return total;
      if (!Number.isFinite(jpy.amount)) throw new RangeError("Invalid Google Cloud cost.");
      return total + jpy.amount;
    }

    if (service.currentMonthCost === null) return total;

    if (service.currency !== overview.reportingCurrency) {
      throw new TypeError(
        `Currency mismatch for ${service.service}: expected ${overview.reportingCurrency}.`
      );
    }

    assertValidCost(
      service.currentMonthCost,
      `${service.service}.currentMonthCost`
    );

    if (service.estimatedCost !== null) {
      assertValidCost(service.estimatedCost, `${service.service}.estimatedCost`);
    }

    return total + service.currentMonthCost;
  }, 0);
}
