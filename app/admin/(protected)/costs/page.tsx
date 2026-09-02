import type { Metadata } from "next";

import CostOverview from "@/components/admin/CostOverview";
import { monthlyCostOverview } from "@/lib/costs/costData";
import {
  getOpenAICostSnapshot,
  getUtcMonth,
} from "@/lib/costs/openaiCostProvider";

export const metadata: Metadata = {
  title: "コスト管理 | Japan Travel Buddy",
};

export default async function AdminCostsPage() {
  const currentMonth = getUtcMonth(new Date());
  const currentOverview = { ...monthlyCostOverview, month: currentMonth };
  const openAIFixture = currentOverview.services.find(
    (service) => service.service === "openai"
  );

  if (!openAIFixture) {
    return <CostOverview overview={currentOverview} />;
  }

  const openAISnapshot = await getOpenAICostSnapshot(
    openAIFixture,
    currentMonth
  );
  const overview = {
    ...currentOverview,
    services: currentOverview.services.map((service) =>
      service.service === "openai" ? openAISnapshot : service
    ),
  };

  return <CostOverview overview={overview} />;
}
