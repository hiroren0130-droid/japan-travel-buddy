import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { SavedTravelPlan, TravelPlan } from "@/types/travel";

export async function saveTravelPlan(
  uid: string,
  plan: TravelPlan
): Promise<void> {
  const q = query(
    collection(db, "travelPlans"),
    where("uid", "==", uid),
    where("title", "==", plan.title)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    throw new Error("この旅行プランはすでに保存されています。");
  }

  await addDoc(collection(db, "travelPlans"), {
    uid,
    title: plan.title,
    summary: plan.summary,
    days: plan.days,
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
  data: {
    title?: string;
    summary?: string;
  }
) {
  const ref = doc(db, "travelPlans", id);

  await updateDoc(ref, data);
}