import type { ReactNode } from "react";
import { getPageUrlMetadata } from "@/lib/seoMetadata";

export const metadata = {
  ...getPageUrlMetadata("/login"),
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
