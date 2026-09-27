import { getPrefectureDisplayName, isPrefectureId } from "@/data/regions";
import { type Locale } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

// Only routes with an explicit translation contract belong here. Unknown
// routes keep their server metadata, even when the UI language changes.
export function getLocalizedPageMetadata(pathname: string, locale: Locale) {
  const messages = getMessages(locale);
  const prefectureId = pathname.match(/^\/discover\/([^/]+)$/)?.[1];
  if (prefectureId && isPrefectureId(prefectureId)) {
    const name = getPrefectureDisplayName(prefectureId, locale);
    return {
      title: locale === "en"
        ? `Discover ${name} | Japan Travel Buddy`
        : `${name}スポットを探す | Japan Travel Buddy`,
      description: locale === "en"
        ? `Browse sightseeing spots in ${name}.`
        : `${name}の観光スポットを一覧から探せます。`,
    };
  }
  switch (pathname) {
    case "/": return {
      title: messages.siteMetadata.defaultTitle,
      description: messages.siteMetadata.description,
    };
    case "/about": return messages.aboutPage.metadata;
    case "/contact": return messages.contactPage.metadata;
    case "/privacy": return messages.privacyPage.metadata;
    case "/terms": return messages.termsPage.metadata;
    default: return null;
  }
}

type TextField = "title" | "description" | "og:title" | "og:description"
  | "twitter:title" | "twitter:description";

export function translateMetadataText(
  pathname: string,
  locale: Locale,
  field: TextField,
  current: string,
): string {
  const target = getLocalizedPageMetadata(pathname, locale);
  if (!target) return current;

  const textKey = field.endsWith("description") ? "description" : "title";
  for (const sourceLocale of ["ja", "en"] as const) {
    const source = getLocalizedPageMetadata(pathname, sourceLocale)!;
    const site = getMessages(sourceLocale).siteMetadata;
    if (current === source[textKey]) return target[textKey];
    // Existing server titles may have the parent title template applied.
    if (field === "title" && pathname !== "/"
      && current === site.titleTemplate.replace("%s", source.title)) {
      return getMessages(locale).siteMetadata.titleTemplate.replace("%s", target.title);
    }
    const socialKey = {
      "og:title": "openGraphTitle",
      "og:description": "openGraphDescription",
      "twitter:title": "twitterTitle",
      "twitter:description": "twitterDescription",
    } as const;
    if (field in socialKey) {
      const key = socialKey[field as keyof typeof socialKey];
      if (current === site[key]) return getMessages(locale).siteMetadata[key];
    }
  }
  // A page can supply a bespoke title, description or social-card text.
  // Never substitute a generic fallback for text we do not own.
  return current;
}
