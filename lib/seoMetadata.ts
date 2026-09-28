import type { Metadata } from "next";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

export const SITE_ORIGIN = "https://japan-travel-buddy-cmuv-psi.vercel.app";
const messages = getMessages(DEFAULT_LOCALE).siteMetadata;

// No URL here: the root layout must not give every child the home URL.
export const sharedOpenGraph = {
  type: "website",
  locale: "ja_JP",
  siteName: messages.openGraphSiteName,
  title: messages.openGraphTitle,
  description: messages.openGraphDescription,
  images: [{
    url: "/og-image.jpg",
    width: 1200,
    height: 630,
    alt: messages.openGraphImageAlt,
  }],
} satisfies NonNullable<Metadata["openGraph"]>;

export function getCanonicalUrl(pathname: string): string {
  // Accept internal paths only. Never derive the public origin from a request
  // host, preview deployment, query string, or user-provided absolute URL.
  if (!pathname.startsWith("/") || pathname.startsWith("//")
    || /[\\\u0000-\u0020]/.test(pathname)) {
    throw new Error("Canonical URL requires an internal absolute path.");
  }
  const url = new URL(pathname, SITE_ORIGIN);
  url.search = "";
  url.hash = "";
  url.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";
  // Match Next.js metadata serialization and the existing sitemap at root.
  return url.pathname === "/" ? url.origin : url.href;
}

export function getPageUrlMetadata(pathname: string): Metadata {
  const url = getCanonicalUrl(pathname);
  return {
    alternates: { canonical: url },
    // Next.js replaces nested openGraph objects rather than deep-merging them.
    // Keep the existing image and social text when supplying a page URL.
    openGraph: { ...sharedOpenGraph, url },
  };
}
