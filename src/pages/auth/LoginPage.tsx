import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SkyShell } from "../../core/layout/SkyShell";
import { useI18n } from "../../core/i18n/I18nContext";
import { useAuth } from "../../core/auth/AuthContext";
import { AuthCard } from "./AuthCard";
import { OAuthButtons } from "../../shared/components/OAuthButtons";
import { FormField } from "../../shared/components/FormField";
import "./AuthForm.css";

export default function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const justRegistered = Boolean(
    (location.state as { registered?: boolean } | null)?.registered
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = login(email, password);
    if (result === "ok") {
      navigate("/dashboard");
    } else {
      setShowError(true);
    }
  }

  return (
    <SkyShell frameClassName="auth-frame">
      <AuthCard>
        <div className="ricon">&#9673;</div>
        <h1>{t("login_h")}</h1>
        <div className="auth-sub">{t("tagline")}</div>

        {showError && <div className="msg err">{t("err_login")}</div>}
        {justRegistered && !showError && (
          <div className="msg ok">{t("ok_reg")}</div>
        )}

        <form onSubmit={handleSubmit}>
          <FormField
            id="emailInput"
            type="email"
            label={t("email")}
            placeholder={t("email_ph")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FormField
            id="passwordInput"
            type="password"
            label={t("password")}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="auth-btn">
            {t("login_btn")}
          </button>
        </form>

        <div className="auth-divider">{t("or")}</div>
        <OAuthButtons
          googleLabel={t("login_google")}
          githubLabel={t("login_github")}
        />

        <div className="auth-foot">
          <span>{t("no_acct")}</span>{" "}
          <Link to="/signup">{t("create_acct")}</Link>
        </div>
      </AuthCard>
    </SkyShell>
  );
}
