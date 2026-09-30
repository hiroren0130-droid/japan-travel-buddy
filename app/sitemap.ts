import type { MetadataRoute } from "next";
import { allSpots } from "@/data";
import { isPrefectureId } from "@/data/regions";
import { getCanonicalUrl } from "@/lib/seoMetadata";

export default function sitemap(): MetadataRoute.Sitemap {
  // Explicit public content only: omit account pages, noindex and redirects.
  const staticPaths = ["/", "/chat", "/about", "/contact", "/privacy", "/terms", "/image-credits"];
  const regionPaths = [...new Set(allSpots.map(spot => spot.prefectureId))]
    .filter(isPrefectureId)
    .map(id => `/discover/${encodeURIComponent(id)}`);
  const spotPaths = allSpots.map(spot => `/spots/${encodeURIComponent(spot.id)}`);

  // No reliable content update dates exist; build time is not lastModified.
  return [...new Set([...staticPaths, ...regionPaths, ...spotPaths])]
    .map(path => ({ url: getCanonicalUrl(path) }));
}
