import React from "react";
import skyBg from "../../assets/sky-bg.jpg";
import logo from "../../assets/logo.png";
import { useAuth } from "../auth/AuthContext";
import "./SkyShell.css";

interface SkyShellProps {
  children: React.ReactNode;
  /** Extra class applied to the inner white frame (per-page tweaks). */
  frameClassName?: string;
}

/**
 * SkyShell - Main application layout wrapper
 * Provides topbar with brand, account info, and Tools menu (including Sahab Forge)
 */
export function SkyShell({ children, frameClassName }: SkyShellProps) {
  const { session } = useAuth();

  const accountLabel =
    session?.fullName || session?.email?.split("@")[0] || "SAHAB";

  return (
    <div
      className="sky-page"
      style={{ ["--sky-bg-image" as string]: `url(${skyBg})` }}
    >
      <div className="sky-topbar">
        <div className="sky-brand">
          <img src={logo} alt="SAHAB" />
          <span className="sky-acc">{accountLabel}</span>
        </div>
      </div>
      <div className={`sky-frame${frameClassName ? ` ${frameClassName}` : ""}`}>
        {children}
      </div>
    </div>
  );
}
