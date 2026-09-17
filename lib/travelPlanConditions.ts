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
  const updates: Partial<Record<keyof TravelPlanConditions, string | null>> = {};
  for (const key of ["startLocation", "startTime", "endLocation", "endTime"] as const) {
    const value = plan[key];
    if (value === undefined) continue;
    if (key === "startTime" || key === "endTime") {
      if (value !== "" && !TIME_PATTERN.test(value)) {
        throw new InvalidTravelPlanTimeError();
      }
      updates[key] = value === "" ? null : value;
    } else {
      updates[key] = normalizeLocation(value) ?? null;
    }
  }
  return updates;
}

export class InvalidTravelPlanTimeError extends Error {
  constructor() {
    super("Time must use HH:mm format.");
    this.name = "InvalidTravelPlanTimeError";
  }
}
