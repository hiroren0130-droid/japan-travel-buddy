import { Timestamp } from "firebase/firestore";

export interface TravelPlan {
  title: string;
  summary: string;
  days: TravelDay[];
}

export interface TravelDay {
  day: number;
  items: TravelSpot[];
}

export interface TravelSpot {
  time: string;

  // Spot DatabaseのID
  spotId: string;

  // AIが生成する説明
  description: string;

  // 移動情報
  transport?: string;
  duration?: string;
}

export interface SavedTravelPlan extends TravelPlan {
  id: string;
  createdAt?: Timestamp;
}

export interface TravelRequest {
  destination: string;
  days: number;
  people: string;
  budget: string;
  interest: string;
}

export interface TravelResponse {
  message: string;
  plan: TravelPlan;
}