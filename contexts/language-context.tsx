import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { Language, LANGUAGES, translate } from "@/lib/translations";

const LANGUAGE_PREF_KEY = "language_preference";

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((l) => l.code === value);
}

// First launch: follow the device language when it is one we support.
function deviceLanguage(): Language {
  const code = Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 2);
  return isLanguage(code) ? code : "en";
}

type LanguageContextValue = {
  language: Language;
  // BCP 47 tag for toLocaleDateString / toLocaleString.
  locale: string;
  setLanguage: (language: Language) => void;
  t: (text: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(deviceLanguage);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_PREF_KEY)
      .then((saved) => {
        if (isLanguage(saved)) setLanguageState(saved);
      })
      .catch(() => {
        /* no-op: keep the device language */
      });
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    AsyncStorage.setItem(LANGUAGE_PREF_KEY, next).catch(() => {
      /* no-op: applies for this session only */
    });
  }, []);

  const t = useCallback(
    (text: string, vars?: Record<string, string | number>) => translate(language, text, vars),
    [language],
  );

  const locale = LANGUAGES.find((l) => l.code === language)!.locale;

  return (
    <LanguageContext.Provider value={{ language, locale, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
