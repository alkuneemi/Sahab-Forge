import React from "react";
import logo from "../../assets/logo.png";
import heroPreview from "../../assets/hero-preview.jpg";
import { LangSwitcher } from "../../core/layout/LangSwitcher";
import { useI18n } from "../../core/i18n/I18nContext";
import "./AuthCard.css";

interface AuthCardProps {
  children: React.ReactNode;
}

/**
 * Reproduces the original auth-page "shell": a translucent header with the
 * SAHAB logo + top navigation + language switch, and a white card split
 * into an image panel and a form panel (passed in as children).
 */
export function AuthCard({ children }: AuthCardProps) {
  const { t } = useI18n();

  return (
    <div className="shell">
      <div className="auth-header">
        <div className="brand">
          <div className="logo-wrap">
            <img src={logo} alt="SAHAB" />
          </div>
          <span className="brand-text">SAHAB</span>
        </div>
        <div className="auth-header-right">
          <nav className="nav">
            <span className="nav-item">{t("nav_dash")}</span>
            <span className="nav-item active">{t("nav_comp")}</span>
            <span className="nav-item">{t("nav_emp")}</span>
            <span className="nav-item">{t("nav_flow")}</span>
            <span className="nav-item">{t("nav_pay")}</span>
            <span className="nav-item">{t("nav_set")}</span>
          </nav>
          <LangSwitcher />
        </div>
      </div>
      <div className="card">
        <div
          className="card-left"
          style={{ backgroundImage: `url(${heroPreview})` }}
        />
        <div className="card-right">{children}</div>
      </div>
    </div>
  );
}
