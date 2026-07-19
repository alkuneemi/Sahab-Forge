import { Link, useNavigate } from "react-router-dom";
import logo from "../../../assets/logo.png";
import { useI18n } from "../../../core/i18n/I18nContext";
import { useAuth } from "../../../core/auth/AuthContext";
import { useModuleRegistry } from "../../../core/modules/ModuleRegistryContext";
import { ForgeNodeIcon } from "../../forge/nodes/ForgeNodeIcons";
import type { DashboardApp } from "../dashboard.data";
import {
  IconApp,
  IconDashboard,
  IconLogout,
  IconMenu,
  IconSettings,
  IconSite,
  IconSystem,
  IconUsers,
} from "./icons";
import "./Sidebar.css";

interface SidebarProps {
  apps: DashboardApp[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  apps,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { t } = useI18n();
  const { session, logout } = useAuth();
  const { sidebarItems } = useModuleRegistry();
  const navigate = useNavigate();

  const displayName =
    session?.fullName || session?.email?.split("@")[0] || t("user_fallback");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const classNames = [
    "sidebar",
    collapsed ? "collapsed" : "",
    mobileOpen ? "open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={classNames}>
      <div className="sb-head">
        <div className="sb-logo">
          <img
            src={logo}
            alt="SAHAB"
            style={{ width: 24, height: 24, objectFit: "contain" }}
          />
        </div>
        <div className="sb-title">SAHAB</div>
        <button
          className="sb-toggle"
          type="button"
          title={t("toggle_sb")}
          onClick={mobileOpen ? onCloseMobile : onToggleCollapsed}
        >
          <IconMenu />
        </button>
      </div>

      <div className="sb-scroll">
        <div className="sb-sec">{t("app_section")}</div>
        <div>
          {apps.length === 0 ? (
            <div className="sb-empty">{t("no_apps")}</div>
          ) : (
            apps.map((app) => (
              <Link
                key={app.techName}
                className="sb-item"
                to={`/apps/${encodeURIComponent(app.techName)}`}
                title={app.appName}
                onClick={onCloseMobile}
              >
                <span className="sb-ic app-ic">
                  {app.logoUrl ? <img src={app.logoUrl} alt="" /> : <IconApp />}
                </span>
                <span className="lbl">{app.appName}</span>
              </Link>
            ))
          )}
        </div>

        <div className="sb-sec">TOOLS</div>
        <Link className="sb-item" to="/forge" onClick={onCloseMobile}>
          <span className="sb-ic">
            <ForgeNodeIcon kind="tool" size={18} />
          </span>
          <span className="lbl">Sahab Forge</span>
        </Link>

        {sidebarItems.length > 0 && (
          <>
            <div className="sb-sec">{t("app_section")}+</div>
            {sidebarItems.map((item) => (
              <Link
                key={item.id}
                className="sb-item"
                to={item.path}
                onClick={onCloseMobile}
              >
                <span className="sb-ic">{item.icon}</span>
                <span className="lbl">{t(item.labelKey)}</span>
              </Link>
            ))}
          </>
        )}
      </div>

      <div className="sb-foot">
        <div className="sb-sec">{t("sys_section")}</div>
        <Link className="sb-item active" to="/dashboard" onClick={onCloseMobile}>
          <span className="sb-ic">
            <IconDashboard />
          </span>
          <span className="lbl">{t("m_dashboard")}</span>
        </Link>
        <Link className="sb-item" to="/system-control" onClick={onCloseMobile}>
          <span className="sb-ic">
            <IconSystem />
          </span>
          <span className="lbl">{t("m_system")}</span>
        </Link>
        <Link className="sb-item" to="/users-admin" onClick={onCloseMobile}>
          <span className="sb-ic">
            <IconUsers />
          </span>
          <span className="lbl">{t("m_users")}</span>
        </Link>
        <Link className="sb-item" to="/system-control" onClick={onCloseMobile}>
          <span className="sb-ic">
            <IconSettings />
          </span>
          <span className="lbl">{t("m_settings")}</span>
        </Link>
        <Link className="sb-item" to="/site-settings" onClick={onCloseMobile}>
          <span className="sb-ic">
            <IconSite />
          </span>
          <span className="lbl">{t("m_site")}</span>
        </Link>

        <div className="sb-user">
          <div className="sb-av">{displayName.charAt(0).toUpperCase()}</div>
          <div className="sb-uinfo">
            <div className="sb-label">{t("user_label")}</div>
            <div className="sb-uname">{displayName}</div>
            <div className="sb-umail">{session?.email || "—"}</div>
          </div>
        </div>
        <button className="sb-item" type="button" onClick={handleLogout}>
          <span className="sb-ic">
            <IconLogout />
          </span>
          <span className="lbl">{t("logout")}</span>
        </button>
      </div>
    </aside>
  );
}
