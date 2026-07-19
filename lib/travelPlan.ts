import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { TravelPlan } from "@/types/travel";

export async function saveTravelPlan(
  uid: string,
  destination: string,
  plan: TravelPlan
) {
  return addDoc(collection(db, "travelPlans"), {
    uid,
    destination,
    title: plan.title,
    summary: plan.summary,
    days: plan.days,
    favorite: false,
    createdAt: serverTimestamp(),
  });
}