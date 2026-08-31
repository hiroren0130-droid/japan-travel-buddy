import type { Metadata } from "next";

import CostOverview from "@/components/admin/CostOverview";
import { monthlyCostOverview } from "@/lib/costs/costData";

export const metadata: Metadata = {
  title: "コスト管理 | Japan Travel Buddy",
};

export default function AdminCostsPage() {
  return <CostOverview overview={monthlyCostOverview} />;
}
