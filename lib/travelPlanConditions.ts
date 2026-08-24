import type { TravelPlan } from "@/types/travel";

type TravelPlanConditions = Pick<
  TravelPlan,
  | "startLocation"
  | "startTime"
  | "endLocation"
  | "endTime"
>;

const TIME_PATTERN =
  /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function normalizeLocation(
  value: string | undefined
): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue || undefined;
}

function normalizeTime(
  value: string | undefined
): string | undefined {
  return value && TIME_PATTERN.test(value)
    ? value
    : undefined;
}

export function serializeTravelPlanConditions(
  plan: TravelPlanConditions
): Partial<TravelPlanConditions> {
  const startLocation = normalizeLocation(
    plan.startLocation
  );
  const startTime = normalizeTime(
    plan.startTime
  );
  const endLocation = normalizeLocation(
    plan.endLocation
  );
  const endTime = normalizeTime(
    plan.endTime
  );

  return {
    ...(startLocation
      ? { startLocation }
      : {}),
    ...(startTime ? { startTime } : {}),
    ...(endLocation ? { endLocation } : {}),
    ...(endTime ? { endTime } : {}),
  };
}

export function serializeTravelPlanConditionUpdates(
  plan: TravelPlanConditions
) {
  const conditions =
    serializeTravelPlanConditions(plan);

  return {
    startLocation:
      conditions.startLocation ?? null,
    startTime:
      conditions.startTime ?? null,
    endLocation:
      conditions.endLocation ?? null,
    endTime:
      conditions.endTime ?? null,
  };
}
