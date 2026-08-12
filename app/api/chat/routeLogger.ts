import {
  calculateAreaRevisitCount,
  calculateAreaSwitches,
  calculateBroadAreaOverloadCount,
calculateBroadAreaSwitchCount,
calculateBusinessHoursViolationCount,
  calculateDayImbalanceCount,
  calculateDuplicateSpotCount,
  calculateFirstItemDurationErrorCount,
  calculateInvalidTimeCount,
  calculateLateEndCount,
  calculateLongDistanceMoveCount,
  calculateLongWalkCount,
  calculateLunchBreakMissingCount,
  calculateOverloadedDayCount,
  calculateRouteScore,
  calculateScheduleConflictCount,
  calculateShortStayCount,
  calculateTransportMismatchCount,
  calculateUnknownSpotCount,
} from "./routeEvaluator";

import {
  isValidAITravelPlan,
} from "./travelValidator";

export function logPlanEvaluation(
  plan: unknown,
  label = "Route Evaluation"
): void {
  if (
    process.env.NODE_ENV !==
      "development" ||
    !isValidAITravelPlan(plan)
  ) {
    return;
  }

  console.log(`===== ${label} =====`);

  console.log({
    areaSwitches:
  calculateAreaSwitches(plan),

broadAreaSwitchCount:
  calculateBroadAreaSwitchCount(
    plan
  ),

broadAreaOverloadCount:
  calculateBroadAreaOverloadCount(
    plan
  ),

    areaRevisitCount:
      calculateAreaRevisitCount(plan),

    shortStayCount:
      calculateShortStayCount(plan),

    scheduleConflictCount:
      calculateScheduleConflictCount(
        plan
      ),

    businessHoursViolationCount:
      calculateBusinessHoursViolationCount(
        plan
      ),

    lunchBreakMissingCount:
      calculateLunchBreakMissingCount(
        plan
      ),

    duplicateSpotCount:
      calculateDuplicateSpotCount(
        plan
      ),

    invalidTimeCount:
      calculateInvalidTimeCount(
        plan
      ),

    longWalkCount:
  calculateLongWalkCount(plan),

longDistanceMoveCount:
  calculateLongDistanceMoveCount(
    plan
  ),

overloadedDayCount:
      calculateOverloadedDayCount(
        plan
      ),

    lateEndCount:
      calculateLateEndCount(plan),

    firstItemDurationErrorCount:
      calculateFirstItemDurationErrorCount(
        plan
      ),

    dayImbalanceCount:
      calculateDayImbalanceCount(
        plan
      ),

    unknownSpotCount:
      calculateUnknownSpotCount(
        plan
      ),

    transportMismatchCount:
      calculateTransportMismatchCount(
        plan
      ),

    score:
      calculateRouteScore(plan),
  });
}
