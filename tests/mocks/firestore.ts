import type {
  SavedTravelPlan,
  TravelPlan,
} from "@/types/travel";
import {
  readFirebaseMockState,
  writeFirebaseMockState,
} from "./firebase-auth";

function updateState(
  update: (
    state: ReturnType<typeof readFirebaseMockState>
  ) => void
) {
  const state = readFirebaseMockState();
  state.calls ??= {};
  state.plans ??= [];
  update(state);
  writeFirebaseMockState(state);
  return state;
}

export async function saveTravelPlan(
  uid: string,
  plan: TravelPlan
): Promise<string> {
  const snapshot = updateState((state) => {
    state.calls!.saveTravelPlan ??= [];
    state.calls!.saveTravelPlan.push({
      uid,
      plan: plan as unknown as Record<string, unknown>,
    });
  });
  if (snapshot.firestore?.saveDeferred) {
    await new Promise<void>((resolve) => {
      window.addEventListener("playwright-release-save", () => resolve(), { once: true });
    });
  }
  if (snapshot.firestore?.saveReject) throw new Error("Mock save failure.");
  if (snapshot.plans?.some((saved) => saved.uid === uid && saved.title === plan.title)) {
    throw new Error("Duplicate plan title.");
  }
  const id = `mock-saved-${crypto.randomUUID()}`;
  updateState((state) => {
    state.plans!.push({ ...plan, id, uid, favorite: false });
  });
  return id;
}

export async function getTravelPlans(
  uid: string
): Promise<SavedTravelPlan[]> {
  const state = updateState((current) => {
    current.calls!.getTravelPlans ??= [];
    current.calls!.getTravelPlans.push(uid);
  });

  return (state.plans ?? [])
    .filter((plan) => plan.uid === uid)
    .map((plan) => ({ ...plan })) as unknown as SavedTravelPlan[];
}

export async function getTravelPlan(
  id: string
): Promise<TravelPlan | null> {
  const state = updateState((current) => {
    current.calls!.getTravelPlan ??= [];
    current.calls!.getTravelPlan.push(id);
  });
  const plan = (state.plans ?? []).find(
    (candidate) => candidate.id === id
  );

  return plan
    ? ({ ...plan } as unknown as TravelPlan)
    : null;
}

export async function deleteTravelPlan(
  id: string
): Promise<void> {
  updateState((state) => {
    state.calls!.deleteTravelPlan ??= [];
    state.calls!.deleteTravelPlan.push(id);
    state.plans = state.plans!.filter(
      (plan) => plan.id !== id
    );
  });
}

export async function updateTravelPlan(
  id: string,
  data: Partial<TravelPlan>
): Promise<void> {
  updateState((state) => {
    state.calls!.updateTravelPlan ??= [];
    state.calls!.updateTravelPlan.push({
      id,
      data: data as Record<string, unknown>,
    });
    state.plans = state.plans!.map((plan) =>
      plan.id === id ? { ...plan, ...data } : plan
    );
  });
}

export async function updateTravelPlanDetails(
  id: string,
  data: Pick<
    TravelPlan,
    | "title"
    | "summary"
    | "startLocation"
    | "startTime"
    | "endLocation"
    | "endTime"
  >
): Promise<void> {
  await updateTravelPlan(id, data);
}
