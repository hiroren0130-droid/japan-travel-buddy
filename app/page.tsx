import HomeContent from "./HomeContent";
import { getPageUrlMetadata } from "@/lib/seoMetadata";

export const metadata = getPageUrlMetadata("/");

export default function HomePage() {
  return <HomeContent />;
}
