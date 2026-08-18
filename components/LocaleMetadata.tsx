"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useLocale } from "@/components/LocaleProvider";

function setMetaContent(selector: string, content: string) {
  document
    .querySelector<HTMLMetaElement>(selector)
    ?.setAttribute("content", content);
}

export default function LocaleMetadata() {
  const pathname = usePathname();
  const { locale, messages } = useLocale();

  useEffect(() => {
    const pageMetadata =
      pathname === "/about"
        ? messages.aboutPage.metadata
        : pathname === "/contact"
          ? messages.contactPage.metadata
          : pathname === "/privacy"
            ? messages.privacyPage.metadata
            : pathname === "/terms"
              ? messages.termsPage.metadata
              : {
                  title: messages.siteMetadata.defaultTitle,
                  description: messages.siteMetadata.description,
                };

    document.title = pageMetadata.title;
    setMetaContent('meta[name="description"]', pageMetadata.description);
    setMetaContent('meta[property="og:title"]', pageMetadata.title);
    setMetaContent('meta[property="og:description"]', pageMetadata.description);
    setMetaContent(
      'meta[property="og:locale"]',
      locale === "en" ? "en_US" : "ja_JP"
    );
    setMetaContent('meta[name="twitter:title"]', pageMetadata.title);
    setMetaContent(
      'meta[name="twitter:description"]',
      pageMetadata.description
    );
  }, [locale, messages, pathname]);

  return null;
}
