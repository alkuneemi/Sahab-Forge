import { useI18n } from "../i18n/I18nContext";
import "./LangSwitcher.css";

export function LangSwitcher() {
  const { lang, toggleLang } = useI18n();
  return (
    <button type="button" className="lang-switcher" onClick={toggleLang}>
      {lang === "ar" ? "English" : "العربية"}
    </button>
  );
}
