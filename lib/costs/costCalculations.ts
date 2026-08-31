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

    return service.includedInTotal
      ? total + service.currentMonthCost
      : total;
  }, 0);
}
