import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { SavedTravelPlan, TravelPlan } from "@/types/travel";
import {
  serializeTravelPlanConditions,
  serializeTravelPlanConditionUpdates,
} from "@/lib/travelPlanConditions";

export async function saveTravelPlan(
  uid: string,
  plan: TravelPlan
): Promise<void> {
  const q = query(
  collection(db, "travelPlans"),
  where("uid", "==", uid),
  orderBy("createdAt", "desc")
);

  const snapshot = await getDocs(q);

const alreadyExists = snapshot.docs.some((doc) => {
  const data = doc.data();

  return data.title === plan.title;
});

if (alreadyExists) {
  throw new Error("同じタイトルの旅行プランはすでに保存されています。");
}

  await addDoc(collection(db, "travelPlans"), {
    uid,
    title: plan.title,
    summary: plan.summary,
    days: plan.days,
    ...serializeTravelPlanConditions(
      plan
    ),
    favorite: false,
    createdAt: serverTimestamp(),
  });
}

export async function getTravelPlans(
  uid: string
): Promise<SavedTravelPlan[]> {
  const q = query(
    collection(db, "travelPlans"),
    where("uid", "==", uid)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
  id: doc.id,
  ...(doc.data() as TravelPlan),
})) as SavedTravelPlan[];
}

export async function getTravelPlan(
  id: string
): Promise<TravelPlan | null> {
  const snapshot = await getDoc(doc(db, "travelPlans", id));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as TravelPlan;
}
export async function deleteTravelPlan(id: string) {
  await deleteDoc(doc(db, "travelPlans", id));
}
export async function updateTravelPlan(
  id: string,
  data: Partial<TravelPlan>
) {
  const ref = doc(db, "travelPlans", id);

  await updateDoc(ref, data);
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
) {
  const ref = doc(db, "travelPlans", id);
  const conditions =
    serializeTravelPlanConditionUpdates(
      data
    );

  await updateDoc(ref, {
    title: data.title,
    summary: data.summary,
    startLocation:
      conditions.startLocation === null
        ? deleteField()
        : conditions.startLocation,
    startTime:
      conditions.startTime === null
        ? deleteField()
        : conditions.startTime,
    endLocation:
      conditions.endLocation === null
        ? deleteField()
        : conditions.endLocation,
    endTime:
      conditions.endTime === null
        ? deleteField()
        : conditions.endTime,
  });
}
