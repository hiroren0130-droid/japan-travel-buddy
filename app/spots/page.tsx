import { redirect } from "next/navigation";

import { PREFECTURE_IDS } from "@/data/regions";
import { getPageUrlMetadata } from "@/lib/seoMetadata";

export const metadata = {
  ...getPageUrlMetadata(`/discover/${PREFECTURE_IDS.KYOTO}`),
  robots: { index: false, follow: true },
};

export default function SpotsPage() {
  redirect(
    `/discover/${PREFECTURE_IDS.KYOTO}`
  );
}
