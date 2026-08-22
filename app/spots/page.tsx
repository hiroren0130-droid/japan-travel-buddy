import { redirect } from "next/navigation";

import { PREFECTURE_IDS } from "@/data/regions";

export default function SpotsPage() {
  redirect(
    `/discover/${PREFECTURE_IDS.KYOTO}`
  );
}
