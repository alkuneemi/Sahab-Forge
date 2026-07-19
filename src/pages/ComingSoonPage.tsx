import { Link } from "react-router-dom";
import { SkyShell } from "../core/layout/SkyShell";
import { useI18n } from "../core/i18n/I18nContext";

export default function ComingSoonPage({ titleKey }: { titleKey?: string }) {
  const { t, lang } = useI18n();
  return (
    <SkyShell frameClassName="auth-frame">
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <h1 style={{ marginBottom: 10 }}>
          {titleKey ? t(titleKey) : lang === "ar" ? "قريباً" : "Coming soon"}
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginBottom: 20 }}>
          {lang === "ar"
            ? "هذه الصفحة ليست جزءاً من هذا البناء بعد."
            : "This page isn't part of this build yet."}
        </p>
        <Link to="/dashboard" style={{ color: "var(--color-primary)", fontWeight: 700 }}>
          {t("m_dashboard")}
        </Link>
      </div>
    </SkyShell>
  );
}
