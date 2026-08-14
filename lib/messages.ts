import type { Locale, LocaleRecord } from "@/lib/locale";

export type AppMessages = {
  appName: string;
  languageName: string;
};

export const messages: LocaleRecord<AppMessages> = {
  ja: {
    appName: "Japan Travel Buddy",
    languageName: "日本語",
  },
  en: {
    appName: "Japan Travel Buddy",
    languageName: "English",
  },
};

export function getMessages(locale: Locale): AppMessages {
  return messages[locale];
}
