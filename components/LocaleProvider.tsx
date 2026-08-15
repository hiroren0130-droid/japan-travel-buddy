"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type Locale,
} from "@/lib/locale";
import {
  getMessages,
  type AppMessages,
} from "@/lib/messages";

const LOCALE_STORAGE_KEY =
  "japan-travel-buddy-locale";
const LOCALE_CHANGE_EVENT =
  "japan-travel-buddy-locale-change";

function subscribeToLocale(
  callback: () => void
): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(
    LOCALE_CHANGE_EVENT,
    callback
  );

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(
      LOCALE_CHANGE_EVENT,
      callback
    );
  };
}

function getStoredLocale(): Locale {
  return normalizeLocale(
    window.localStorage.getItem(
      LOCALE_STORAGE_KEY
    )
  );
}

type LocaleContextValue = {
  locale: Locale;
  messages: AppMessages;
  setLocale: (locale: Locale) => void;
};

const LocaleContext =
  createContext<LocaleContextValue | null>(null);

export default function LocaleProvider({
  children,
}: {
  children: ReactNode;
}) {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getStoredLocale,
    () => DEFAULT_LOCALE
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      window.localStorage.setItem(
        LOCALE_STORAGE_KEY,
        nextLocale
      );
      window.dispatchEvent(
        new Event(LOCALE_CHANGE_EVENT)
      );
    },
    []
  );

  const value = useMemo(
    () => ({
      locale,
      messages: getMessages(locale),
      setLocale,
    }),
    [locale, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error(
      "useLocale must be used within LocaleProvider."
    );
  }

  return context;
}
