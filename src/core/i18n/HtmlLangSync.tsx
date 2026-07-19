import { useEffect } from "react";
import { useI18n } from "./I18nContext";

export function HtmlLangSync() {
  const { lang, dir } = useI18n();

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return null;
}
