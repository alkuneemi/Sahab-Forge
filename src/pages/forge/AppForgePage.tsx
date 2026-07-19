import React, { useState } from "react";
import { useI18n } from "../../core/i18n/I18nContext";
import { SkyShell } from "../../core/layout/SkyShell";
import { ForgeCanvas } from "./diagram/ForgeCanvas";
import { useForgeStore } from "./store/forgeStore";
import { generateReactModule, generateOdooModule, buildForgeModule } from "./codegen/generateModule";
import { getAvailableModules } from "../../modules/registry";
import { useModuleRegistry } from "../../core/modules/ModuleRegistryContext";
import "./AppForge.css";

/**
 * AppForgePage - Sahab Forge main interface
 * Platform for building React applications with drag-and-drop UI builder
 * Uses React Flow for visual app design and Zustand for state management
 */
export default function AppForgePage() {
  const { t } = useI18n();
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppDesc, setNewAppDesc] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const {
    apps,
    currentAppId,
    createApp,
    loadApp,
    deleteApp,
  } = useForgeStore();
  const { install } = useModuleRegistry();

  const currentApp = apps.find((a) => a.id === currentAppId);

  /**
   * Create a new application
   */
  const handleCreateApp = () => {
    if (!newAppName.trim()) return;
    createApp(newAppName, newAppDesc);
    setNewAppName("");
    setNewAppDesc("");
    setShowNewAppModal(false);
  };

  /**
   * Generate React module code
   */
  const handleGenerateReact = () => {
    if (!currentApp) return;
    const code = generateReactModule(currentApp);
    setGeneratedCode(code);
  };

  /**
   * Generate Odoo module code
   */
  const handleGenerateOdoo = () => {
    if (!currentApp) return;
    const result = generateOdooModule(currentApp);
    setGeneratedCode(`# Odoo Module\n${result.pythonCode}\n\n${result.xmlViews}`);
  };

  /**
   * Copy generated code to clipboard
   */
  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      alert(t("copied_to_clipboard") || "Copied to clipboard!");
    }
  };

  const handleInstallGeneratedModule = () => {
    if (!currentApp) return;
    const module = buildForgeModule(currentApp);
    const existing = getAvailableModules().some((candidate) => candidate.id === module.id);
    if (!existing) {
      const registry = window.localStorage.getItem("sahab_local_forge_modules");
      const modules = registry ? JSON.parse(registry) : [];
      modules.push(module);
      window.localStorage.setItem("sahab_local_forge_modules", JSON.stringify(modules));
    }
    install(module.id);
    alert(t("module_installed") || "Module installed");
  };

  return (
    <SkyShell frameClassName="sahab-forge-frame">
      <div className="sahab-forge-container">
        {/* Header */}
        <div className="sahab-forge-header">
          <div className="sahab-forge-title">
            <h1>{t("forge_title") || "Sahab Forge"}</h1>
            <p>{t("forge_desc") || "Build React Applications"}</p>
          </div>
          <button
            className="sahab-forge-btn sahab-forge-btn-primary"
            onClick={() => setShowNewAppModal(true)}
          >
            + {t("new_app") || "New App"}
          </button>
        </div>

        {/* Main Layout */}
        <div className="sahab-forge-layout">
          {/* Sidebar - Apps List */}
          <div className="sahab-forge-sidebar">
            <div className="sahab-forge-sidebar-header">
              {t("your_apps") || "Your Apps"}
            </div>
            <div className="sahab-forge-apps-list">
              {apps.length === 0 ? (
                <div className="sahab-forge-empty-list">
                  {t("no_apps") || "No apps yet"}
                </div>
              ) : (
                apps.map((app) => (
                  <div
                    key={app.id}
                    className={`sahab-forge-app-item ${
                      currentAppId === app.id ? "active" : ""
                    }`}
                    onClick={() => loadApp(app.id)}
                  >
                    <div className="sahab-forge-app-item-content">
                      <div className="sahab-forge-app-name">{app.name}</div>
                      <div className="sahab-forge-app-date">
                        {new Date(app.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      className="sahab-forge-btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(t("confirm_delete") || "Delete app?")) {
                          deleteApp(app.id);
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Main Canvas Area */}
          <div className="sahab-forge-canvas-wrapper">
            {currentApp ? (
              <>
                <ForgeCanvas />
                <div className="sahab-forge-toolbar">
                  <button
                    className="sahab-forge-btn sahab-forge-btn-secondary"
                    onClick={handleGenerateReact}
                  >
                    📦 {t("generate_react") || "Generate React"}
                  </button>
                  <button
                    className="sahab-forge-btn sahab-forge-btn-secondary"
                    onClick={handleGenerateOdoo}
                  >
                    🔧 {t("generate_odoo") || "Generate Odoo"}
                  </button>
                  <button
                    className="sahab-forge-btn sahab-forge-btn-primary"
                    onClick={handleInstallGeneratedModule}
                  >
                    📥 {t("install_module") || "Install Module"}
                  </button>
                </div>
              </>
            ) : (
              <div className="sahab-forge-placeholder">
                <div className="sahab-forge-placeholder-content">
                  <p>📐 {t("no_app_selected") || "No app selected"}</p>
                  <p>{t("create_or_select") || "Create a new app or select one to start"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Code Output */}
          {generatedCode && (
            <div className="sahab-forge-code-panel">
              <div className="sahab-forge-code-header">
                {t("generated_code") || "Generated Code"}
                <button
                  className="sahab-forge-btn-copy"
                  onClick={handleCopyCode}
                  title={t("copy") || "Copy"}
                >
                  📋
                </button>
              </div>
              <pre className="sahab-forge-code-output">{generatedCode}</pre>
            </div>
          )}
        </div>

        {/* New App Modal */}
        {showNewAppModal && (
          <div className="sahab-forge-modal-overlay">
            <div className="sahab-forge-modal">
              <div className="sahab-forge-modal-header">
                {t("create_new_app") || "Create New App"}
              </div>
              <div className="sahab-forge-modal-body">
                <div className="sahab-forge-form-group">
                  <label>{t("app_name") || "App Name"}</label>
                  <input
                    type="text"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder={t("enter_app_name") || "Enter app name"}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleCreateApp();
                    }}
                  />
                </div>
                <div className="sahab-forge-form-group">
                  <label>{t("description") || "Description"}</label>
                  <textarea
                    value={newAppDesc}
                    onChange={(e) => setNewAppDesc(e.target.value)}
                    placeholder={t("enter_description") || "Enter description"}
                    rows={4}
                  />
                </div>
              </div>
              <div className="sahab-forge-modal-footer">
                <button
                  className="sahab-forge-btn sahab-forge-btn-secondary"
                  onClick={() => setShowNewAppModal(false)}
                >
                  {t("cancel") || "Cancel"}
                </button>
                <button
                  className="sahab-forge-btn sahab-forge-btn-primary"
                  onClick={handleCreateApp}
                >
                  {t("create") || "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SkyShell>
  );
}
