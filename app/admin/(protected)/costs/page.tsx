import type { Metadata } from "next";

import CostOverview from "@/components/admin/CostOverview";
import { monthlyCostOverview } from "@/lib/costs/costData";
import { getOpenAICostSnapshot } from "@/lib/costs/openaiCostProvider";

export const metadata: Metadata = {
  title: "コスト管理 | Japan Travel Buddy",
};

export default async function AdminCostsPage() {
  const openAIFixture = monthlyCostOverview.services.find(
    (service) => service.service === "openai"
  );

  if (!openAIFixture) {
    return <CostOverview overview={monthlyCostOverview} />;
  }

  const openAISnapshot = await getOpenAICostSnapshot(
    openAIFixture,
    monthlyCostOverview.month
  );
  const overview = {
    ...monthlyCostOverview,
    services: monthlyCostOverview.services.map((service) =>
      service.service === "openai" ? openAISnapshot : service
    ),
  };

  return <CostOverview overview={overview} />;
}
