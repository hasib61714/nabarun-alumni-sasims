import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "bn" | "en";
const STORAGE_KEY = "lang";

interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Picks the Bengali or English text: `t("বাংলা", "English")`. */
  t: (bn: string, en: string) => string;
  /** Locale for dates and numbers. */
  locale: string;
}

const LangContext = createContext<LangValue | null>(null);

export const localeOf = (lang: Lang) => (lang === "en" ? "en-GB" : "bn-BD");

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "bn" || saved === "en") return saved;
  } catch { /* storage unavailable */ }
  return "bn";
}

/** Bengali / English switch for the public site. The choice is remembered in the browser. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable */ }
  }, []);

  const value = useMemo<LangValue>(
    () => ({ lang, setLang, t: (bn, en) => (lang === "en" ? en : bn), locale: localeOf(lang) }),
    [lang, setLang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}
