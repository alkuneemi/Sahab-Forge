import { useState } from "react";
import { SkyShell } from "../../core/layout/SkyShell";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { HeroView } from "./components/HeroView";
import { ReportsGrid } from "./components/ReportsGrid";
import { mockGallery } from "./dashboard.data";
import { useOdoo } from "../../core/odoo/OdooConnectionContext";
import "./DashboardPage.css";

const SIDEBAR_COLLAPSED_KEY = "sahab_sb";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) !== "0";
  } catch {
    return true;
  }
}

export default function DashboardPage() {
  const { client, apps, activatedTechs } = useOdoo();
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeApps = apps
    .filter((a) => activatedTechs.includes(a.tech))
    .map((a) => ({ techName: a.tech, appName: a.name, logoUrl: a.logo }));

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <SkyShell frameClassName="dashboard-frame">
      <div className="dash-layout">
        {mobileOpen && (
          <div className="dash-backdrop" onClick={() => setMobileOpen(false)} />
        )}
        <Sidebar
          apps={activeApps}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="dash-content">
          <TopBar onOpenMobileMenu={() => setMobileOpen(true)} />
          <div className="dash-main">
            {client ? <ReportsGrid /> : <HeroView gallery={mockGallery} />}
          </div>
        </div>
      </div>
    </SkyShell>
  );
}
