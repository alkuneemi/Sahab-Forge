import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SkyShell } from "../../core/layout/SkyShell";
import { useI18n } from "../../core/i18n/I18nContext";
import { useAuth } from "../../core/auth/AuthContext";
import { AuthCard } from "./AuthCard";
import { OAuthButtons } from "../../shared/components/OAuthButtons";
import { FormField } from "../../shared/components/FormField";
import "./AuthForm.css";

export default function SignupPage() {
  const { t } = useI18n();
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = signup(fullName, email, password);
    if (result === "ok") {
      navigate("/login", { state: { registered: true } });
    } else {
      setShowError(true);
    }
  }

  return (
    <SkyShell frameClassName="auth-frame">
      <AuthCard>
        <div className="ricon">&#9673;</div>
        <h1>{t("signup_h")}</h1>
        <div className="auth-sub">{t("tagline2")}</div>

        {showError && <div className="msg err">{t("err_exists")}</div>}

        <form onSubmit={handleSubmit}>
          <FormField
            id="fullNameInput"
            type="text"
            label={t("full_name")}
            placeholder={t("full_name_ph")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
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
            minLength={6}
            required
          />
          <button type="submit" className="auth-btn">
            {t("signup_btn")}
          </button>
        </form>

        <div className="auth-divider">{t("or_signup")}</div>
        <OAuthButtons
          googleLabel={t("signup_google")}
          githubLabel={t("signup_github")}
        />

        <div className="auth-foot">
          <span>{t("have_acct")}</span>{" "}
          <Link to="/login">{t("login_link")}</Link>
        </div>
      </AuthCard>
    </SkyShell>
  );
}
