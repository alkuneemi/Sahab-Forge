import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Dictionary, Lang, TranslationPack } from "./types";
import { commonDictionary } from "./dictionaries/common";
import { loginDictionary } from "./dictionaries/login";
import { signupDictionary } from "./dictionaries/signup";
import { dashboardDictionary } from "./dictionaries/dashboard";

const STORAGE_KEY = "sahab_lang";

function mergePacks(packs: TranslationPack[]): TranslationPack {
  const result: TranslationPack = { ar: {}, en: {} };
  for (const pack of packs) {
    result.ar = { ...result.ar, ...pack.ar };
    result.en = { ...result.en, ...pack.en };
  }
  return result;
}

/** Every dictionary that ships with the core product (not with a module). */
const BASE_PACK = mergePacks([
  commonDictionary,
  loginDictionary,
  signupDictionary,
  dashboardDictionary,
]);

interface I18nContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  /** Modules call this to extend/override the dictionary while installed. */
  registerDictionary: (moduleId: string, pack: TranslationPack) => void;
  /** Modules call this on uninstall to remove their contributed keys. */
  unregisterDictionary: (moduleId: string) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Lang) || "ar";
    } catch {
      return "ar";
    }
  });

  const [moduleDictionaries, setModuleDictionaries] = useState<
    Record<string, TranslationPack>
  >({});

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore write errors (private mode, etc.) */
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "ar" ? "en" : "ar");
  }, [lang, setLang]);

  const registerDictionary = useCallback(
    (moduleId: string, pack: TranslationPack) => {
      setModuleDictionaries((prev) => ({ ...prev, [moduleId]: pack }));
    },
    []
  );

  const unregisterDictionary = useCallback((moduleId: string) => {
    setModuleDictionaries((prev) => {
      const next = { ...prev };
      delete next[moduleId];
      return next;
    });
  }, []);

  const mergedDictionary: Dictionary = useMemo(() => {
    const modulePacks = Object.values(moduleDictionaries);
    const merged = mergePacks([BASE_PACK, ...modulePacks]);
    return merged[lang];
  }, [lang, moduleDictionaries]);

  const t = useCallback(
    (key: string) => mergedDictionary[key] ?? key,
    [mergedDictionary]
  );

  const value: I18nContextValue = {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    setLang,
    toggleLang,
    t,
    registerDictionary,
    unregisterDictionary,
  };

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
