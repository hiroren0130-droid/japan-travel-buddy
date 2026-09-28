import type { ReactNode } from "react";
import { getPageUrlMetadata } from "@/lib/seoMetadata";

export const metadata = getPageUrlMetadata("/image-credits");

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
