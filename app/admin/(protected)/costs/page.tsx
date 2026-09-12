import type { Metadata } from "next";

import CostOverview from "@/components/admin/CostOverview";
import { requireAdminSession } from "@/lib/auth/admin";
import { monthlyCostOverview } from "@/lib/costs/costData";
import { getGoogleCloudCostSnapshot } from "@/lib/costs/googleCloudCostProvider";
import { getGitHubCostSnapshot } from "@/lib/costs/githubCostSnapshot";
import {
  getOpenAICostSnapshot,
  getUtcMonth,
} from "@/lib/costs/openaiCostProvider";

export const metadata: Metadata = {
  title: "コスト管理 | Japan Travel Buddy",
};

export default async function AdminCostsPage() {
  await requireAdminSession("/admin/costs");
  const currentMonth = getUtcMonth(new Date());
  const currentOverview = { ...monthlyCostOverview, month: currentMonth };
  const openAIFixture = currentOverview.services.find(
    (service) => service.service === "openai"
  );

  const [openAISnapshot, googleCloudSnapshot, githubSnapshot] = await Promise.all([
    openAIFixture ? getOpenAICostSnapshot(openAIFixture, currentMonth) : undefined,
    getGoogleCloudCostSnapshot(currentMonth),
    getGitHubCostSnapshot(currentMonth),
  ]);
  const overview = {
    ...currentOverview,
    services: currentOverview.services.map((service) =>
      service.service === "google-cloud" ? googleCloudSnapshot
        : service.service === "github" ? githubSnapshot
        : service.service === "openai" && openAISnapshot ? openAISnapshot : service
    ),
  };

  return <CostOverview overview={overview} />;
}
