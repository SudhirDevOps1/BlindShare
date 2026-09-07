"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations } from "./dictionary";

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations["en"];
  appName: string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [appName, setAppName] = useState("BlindShare");

  useEffect(() => {
    // Read from localStorage or navigator if available
    const saved = localStorage.getItem("blindshare_lang") as Language;
    if (saved && (saved === "en" || saved === "hi")) {
      setLangState(saved);
    } else {
      const defaultEnv = process.env.NEXT_PUBLIC_UI_LANG_DEFAULT || "en";
      setLangState(defaultEnv === "hi" ? "hi" : "en");
    }

    if (process.env.NEXT_PUBLIC_APP_NAME) {
      setAppName(process.env.NEXT_PUBLIC_APP_NAME);
    }

    // Restore user language preference from database if authenticated
    fetch("/api/user/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings?.language && (d.settings.language === "en" || d.settings.language === "hi")) {
          setLangState(d.settings.language);
          try {
            localStorage.setItem("blindshare_lang", d.settings.language);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("blindshare_lang", newLang);
      fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLang }),
      }).catch(() => {});
    } catch {}
  };

  const t = translations[lang] || translations.en;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, appName }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      lang: "en" as Language,
      setLang: () => {},
      t: translations.en,
      appName: "BlindShare",
    };
  }
  return context;
}
