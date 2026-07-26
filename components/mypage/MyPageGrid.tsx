"use client";

import { Timestamp } from "firebase/firestore";

import { SavedTravelPlan } from "@/types/travel";
import MyPageCard from "./MyPageCard";

type SavedPlan = SavedTravelPlan & {
  createdAt?: Timestamp;
};

type Props = {
  plans: SavedPlan[];
  onDelete: (id: string) => void;
};

export default function MyPageGrid({
  plans,
  onDelete,
}: Props) {
  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <MyPageCard
          key={`${plan.id}-${plan.title}`}
          plan={plan}
          onDelete={() => onDelete(plan.id)}
        />
      ))}
    </div>
  );
}