"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useLocale } from "@/components/LocaleProvider";
import { getLocalizedPageMetadata, translateMetadataText } from "@/lib/localeMetadata";

export default function LocaleMetadata() {
  const pathname = usePathname();
  const { locale } = useLocale();

  useEffect(() => {
    if (!getLocalizedPageMetadata(pathname, locale)) return;

    const syncMetadata = () => {
      const title = translateMetadataText(pathname, locale, "title", document.title);
      if (title !== document.title) document.title = title;
      const fields = [
        ["description", 'meta[name="description"]'],
        ["og:title", 'meta[property="og:title"]'],
        ["og:description", 'meta[property="og:description"]'],
        ["twitter:title", 'meta[name="twitter:title"]'],
        ["twitter:description", 'meta[name="twitter:description"]'],
      ] as const;
      let translatedOpenGraph = false;
      for (const [field, selector] of fields) {
        const element = document.querySelector<HTMLMetaElement>(selector);
        if (!element) continue;
        const current = element.content;
        const translated = translateMetadataText(pathname, locale, field, current);
        if (translated !== current) {
          element.content = translated;
          if (field.startsWith("og:")) translatedOpenGraph = true;
        }
      }
      const ogLocale = document.querySelector<HTMLMetaElement>('meta[property="og:locale"]');
      if (translatedOpenGraph && ogLocale && ["ja_JP", "en_US"].includes(ogLocale.content)) {
        const translatedLocale = locale === "en" ? "en_US" : "ja_JP";
        if (ogLocale.content !== translatedLocale) ogLocale.content = translatedLocale;
      }
    };

    // URL identity, indexing directives and images belong to server metadata.
    // Do not create or rewrite canonical, og:url, robots or image tags here.
    // Next.js can commit head metadata after this effect (hydration/navigation).
    // Reapply only recognized translations; disconnect when the route changes.
    const observer = new MutationObserver(syncMetadata);
    observer.observe(document.head, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["content"],
    });
    syncMetadata();
    return () => observer.disconnect();
  }, [locale, pathname]);

  return null;
}
