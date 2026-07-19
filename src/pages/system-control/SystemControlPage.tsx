import { useState } from "react";
import { Link } from "react-router-dom";
import { SkyShell } from "../../core/layout/SkyShell";
import { useI18n } from "../../core/i18n/I18nContext";
import { useModuleRegistry } from "../../core/modules/ModuleRegistryContext";
import { useOdoo } from "../../core/odoo/OdooConnectionContext";
import {
  listGitHubBranches,
  listGitHubDirectories,
  listGitHubRepositories,
} from "../../core/modules/remote/githubSource";
import "./SystemControlPage.css";

export default function SystemControlPage() {
  const { t, lang } = useI18n();
  const { modules, isInstalled, install, uninstall, source, connectSource, disconnectSource, sourceLoading, sourceError } = useModuleRegistry();
  const {
    config, setConfig, aiConfig, setAiConfig,
    uid, connecting, connectError, connect,
    apps, activatedTechs, toggleActivated,
  } = useOdoo();

  const [form, setForm] = useState(config);
  const [ai, setAi] = useState(aiConfig);
  const [githubOwner, setGithubOwner] = useState(source?.owner || "");
  const [githubToken, setGithubToken] = useState(source?.token || "");
  const [repoOptions, setRepoOptions] = useState<Array<{ name: string; fullName: string; owner: string }>>([]);
  const [selectedRepo, setSelectedRepo] = useState(source?.repo || "");
  const [selectedRepoOwner, setSelectedRepoOwner] = useState(source?.owner || "");
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(source?.branch || "main");
  const [folderOptions, setFolderOptions] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState(source?.folder || "");
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [repoListError, setRepoListError] = useState<string | null>(null);
  const [branchListError, setBranchListError] = useState<string | null>(null);
  const [folderListError, setFolderListError] = useState<string | null>(null);

  const clearRepoState = () => {
    setRepoOptions([]);
    setSelectedRepo("");
    setSelectedRepoOwner(githubOwner);
    setBranchOptions([]);
    setSelectedBranch("main");
    setFolderOptions([]);
    setSelectedFolder("");
    setBranchListError(null);
    setFolderListError(null);
  };

  const loadRepositories = async () => {
    setRepoListError(null);
    setBranchListError(null);
    setFolderListError(null);
    setLoadingRepos(true);
    setRepoOptions([]);
    setSelectedRepo("");
    setSelectedRepoOwner(githubOwner);
    setBranchOptions([]);
    setSelectedBranch("main");
    setFolderOptions([]);
    setSelectedFolder("");

    try {
      const repos = await listGitHubRepositories(
        githubToken || undefined,
        githubOwner || undefined
      );
      setRepoOptions(repos);
      if (repos.length === 0) {
        setRepoListError("No repositories were found for the provided account or token.");
      }
    } catch (error) {
      setRepoListError(error instanceof Error ? error.message : "Unable to load repositories.");
    } finally {
      setLoadingRepos(false);
    }
  };

  const loadBranchesForRepo = async (repoName: string, repoOwner: string) => {
    setBranchListError(null);
    setFolderListError(null);
    setBranchOptions([]);
    setSelectedBranch("main");
    setFolderOptions([]);
    setSelectedFolder("");
    setLoadingBranches(true);

    try {
      const branches = await listGitHubBranches(repoOwner, repoName, githubToken || undefined);
      setBranchOptions(branches);
      if (branches.length === 0) {
        setBranchListError("No branches were found for the selected repository.");
      }
    } catch (error) {
      setBranchListError(error instanceof Error ? error.message : "Unable to load branches.");
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadFoldersForBranch = async (repoName: string, repoOwner: string, branchName: string) => {
    setFolderListError(null);
    setFolderOptions([]);
    setSelectedFolder("");
    setLoadingFolders(true);

    try {
      const directories = await listGitHubDirectories(
        repoOwner,
        repoName,
        branchName,
        "",
        githubToken || undefined
      );
      setFolderOptions(directories);
    } catch (error) {
      setFolderListError(error instanceof Error ? error.message : "Unable to load folders.");
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleRepoChange = async (repoName: string) => {
    setSelectedRepo(repoName);
    setSelectedBranch("main");
    setFolderOptions([]);
    setSelectedFolder("");
    setBranchListError(null);
    setFolderListError(null);

    if (!repoName) {
      setBranchOptions([]);
      return;
    }

    const selected = repoOptions.find((item) => item.name === repoName);
    const repoOwner = selected?.owner || githubOwner || selectedRepoOwner;
    if (selected?.owner) {
      setSelectedRepoOwner(selected.owner);
    } else if (githubOwner) {
      setSelectedRepoOwner(githubOwner);
    }

    if (repoOwner) {
      await loadBranchesForRepo(repoName, repoOwner);
    }
  };

  const handleBranchChange = async (branchName: string) => {
    setSelectedBranch(branchName);
    setFolderListError(null);
    setFolderOptions([]);
    setSelectedFolder("");

    if (!selectedRepo) {
      return;
    }

    const repoOwner = selectedRepoOwner || githubOwner;
    if (repoOwner) {
      await loadFoldersForBranch(selectedRepo, repoOwner, branchName);
    }
  };

  const handleConnectSource = () => {
    if (!selectedRepo || !selectedBranch) return;

    const sourceConfig = {
      owner: selectedRepoOwner || githubOwner,
      repo: selectedRepo,
      branch: selectedBranch,
      folder: selectedFolder || undefined,
      token: githubToken || undefined,
    };

    connectSource(sourceConfig);
  };

  return (
    <SkyShell frameClassName="auth-frame">
      <div className="sc-page">
        <div className="sc-head">
          <h1>{t("m_system")}</h1>
          <Link to="/dashboard" className="sc-back">{t("m_dashboard")}</Link>
        </div>

        {/* --- Odoo connection --- */}
        <section className="sc-section">
          <h2>{lang === "ar" ? "الاتصال بـ Odoo" : "Odoo connection"}</h2>
          <p className="sc-hint">
            {lang === "ar"
              ? "تُستخدم هذه البيانات للاتصال بخادم Odoo الخاص بكم عبر jsonrpc (نفس بروتوكول الربط الأصلي). بعد الاتصال ستظهر تطبيقاتكم المثبتة أدناه لتفعيلها."
              : "Used to connect to your own Odoo server via jsonrpc (same protocol as the original integration). Once connected, your installed apps appear below to activate."}
          </p>
          <div className="sc-grid">
            <input placeholder={lang === "ar" ? "رابط الخادم (https://...)" : "Server URL (https://...)"} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            <input placeholder={lang === "ar" ? "قاعدة البيانات" : "Database"} value={form.db} onChange={(e) => setForm({ ...form, db: e.target.value })} />
            <input placeholder={lang === "ar" ? "اسم المستخدم" : "Username"} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <input placeholder={lang === "ar" ? "مفتاح API" : "API Key"} type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
          </div>
          <button type="button" className="sc-btn" disabled={connecting} onClick={() => { setConfig(form); connect(); }}>
            {connecting ? (lang === "ar" ? "جارٍ الاتصال..." : "Connecting...") : lang === "ar" ? "اتصال" : "Connect"}
          </button>
          <span className={`sc-status ${uid ? "ok" : ""}`}>
            {uid ? (lang === "ar" ? `متصل (uid ${uid})` : `Connected (uid ${uid})`) : connectError ? connectError : lang === "ar" ? "غير متصل" : "Not connected"}
          </span>
        </section>

        {/* --- AI analyst --- */}
        <section className="sc-section">
          <h2>{lang === "ar" ? "محلل السجلات الذكي" : "Records AI analyst"}</h2>
          <p className="sc-hint">
            {lang === "ar"
              ? "نقطة نهاية HTTP (مثل webhook n8n) تستقبل آخر 50 سجلاً وتُرجع تحليلاً بصيغة HTML يبدأ بالمخاطر ثم التحذيرات ثم الفرص والتوصيات."
              : "An HTTP endpoint (e.g. an n8n webhook) that receives the last 50 records and returns an HTML analysis: risks, then warnings, then opportunities and recommendations."}
          </p>
          <div className="sc-grid">
            <input placeholder={lang === "ar" ? "رابط نقطة النهاية" : "Endpoint URL"} value={ai.endpoint} onChange={(e) => setAi({ ...ai, endpoint: e.target.value })} />
            <input placeholder={lang === "ar" ? "مفتاح API (اختياري)" : "API Key (optional)"} type="password" value={ai.apiKey || ""} onChange={(e) => setAi({ ...ai, apiKey: e.target.value })} />
          </div>
          <button type="button" className="sc-btn" onClick={() => setAiConfig(ai)}>
            {lang === "ar" ? "حفظ" : "Save"}
          </button>
        </section>

        {/* --- Apps --- */}
        {apps.length > 0 && (
          <section className="sc-section">
            <h2>{lang === "ar" ? "تطبيقات Odoo" : "Odoo apps"}</h2>
            <div className="sc-modules">
              {apps.map((app) => {
                const active = activatedTechs.includes(app.tech);
                return (
                  <div className="sc-module-card" key={app.tech}>
                    <div className="sc-module-info">
                      <div className="sc-module-name">{app.name} <span className="sc-module-version">{app.tech}</span></div>
                    </div>
                    <button
                      type="button"
                      className={active ? "sc-btn sc-btn-danger" : "sc-btn"}
                      onClick={() => toggleActivated(app.tech)}
                    >
                      {active ? (lang === "ar" ? "إلغاء التفعيل" : "Deactivate") : (lang === "ar" ? "تفعيل" : "Activate")}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* --- External developer repository (module marketplace) --- */}
        <section className="sc-section">
          <h2>{lang === "ar" ? "مستودع المطورين الخارجي (GitHub)" : "External developer repository (GitHub)"}</h2>
          <p className="sc-hint">
            {lang === "ar"
              ? "اربط مستودع GitHub عام يحوي وحدات مبنية بواسطة SDK الوحدات المنفصل (راجع مجلد sahab-module-sdk). يجب أن يحوي المستودع ملف sahab.modules.json في الجذر أو داخل مجلد فرعي. عند الربط، تظهر كل وحدة فيه تلقائياً كتطبيق قابل للتثبيت أدناه."
              : "Connect a public GitHub repo built with the separate module SDK (see the sahab-module-sdk folder). The repo must have a sahab.modules.json manifest at its root or inside an optional subfolder. Once connected, every module in it appears below as an installable app automatically."}
          </p>
          {source ? (
            <>
              <span className="sc-status ok">
                {lang === "ar" ? "متصل بـ" : "Connected to"} {source.owner}/{source.repo}@{source.branch}
                {source.folder ? ` / ${source.folder}` : ""}
              </span>
              <button type="button" className="sc-btn sc-btn-danger" style={{ marginInlineStart: 10 }} onClick={disconnectSource}>
                {lang === "ar" ? "قطع الاتصال" : "Disconnect"}
              </button>
            </>
          ) : (
            <>
              <div className="sc-grid">
                <input
                  placeholder={lang === "ar" ? "مالك المستودع (اختياري)" : "Repo owner (optional)"}
                  value={githubOwner}
                  onChange={(e) => setGithubOwner(e.target.value)}
                />
                <input
                  placeholder={lang === "ar" ? "GitHub Token (اختياري)" : "GitHub Token (optional)"}
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                />
                <button
                  type="button"
                  className="sc-btn"
                  disabled={loadingRepos || (!githubOwner && !githubToken)}
                  onClick={loadRepositories}
                >
                  {loadingRepos ? (lang === "ar" ? "جارٍ التحميل..." : "Load repositories...") : (lang === "ar" ? "تحميل المستودعات" : "Load repositories")}
                </button>
              </div>

              {repoListError && <span className="sc-status">{repoListError}</span>}

              {repoOptions.length > 0 && (
                <div className="sc-grid">
                  <select value={selectedRepo} onChange={(e) => void handleRepoChange(e.target.value)}>
                    <option value="">{lang === "ar" ? "اختر المستودع" : "Select repository"}</option>
                    {repoOptions.map((repo) => (
                      <option key={repo.fullName} value={repo.name}>
                        {repo.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedRepo && (
                <>
                  <div className="sc-grid">
                    <select value={selectedBranch} onChange={(e) => void handleBranchChange(e.target.value)} disabled={branchOptions.length === 0 && !loadingBranches}>
                      <option value="">{lang === "ar" ? "اختر الفرع" : "Select branch"}</option>
                      {branchOptions.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                  </div>
                  {branchListError && <span className="sc-status">{branchListError}</span>}
                </>
              )}

              {selectedBranch && (
                <>
                  <div className="sc-grid">
                    <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)} disabled={loadingFolders}>
                      <option value="">{lang === "ar" ? "الجذر" : "Root folder"}</option>
                      {folderOptions.map((folderName) => (
                        <option key={folderName} value={folderName}>
                          {folderName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {folderListError && <span className="sc-status">{folderListError}</span>}
                </>
              )}

              <button
                type="button"
                className="sc-btn"
                disabled={sourceLoading || !selectedRepo || !selectedBranch}
                onClick={handleConnectSource}
              >
                {sourceLoading ? (lang === "ar" ? "جارٍ الربط..." : "Connecting...") : (lang === "ar" ? "ربط واستيراد الوحدات" : "Connect & import modules")}
              </button>
              {sourceError && <span className="sc-status">{sourceError}</span>}
            </>
          )}
        </section>

        {/* --- Modules --- */}
        <section className="sc-section">
          <h2>{lang === "ar" ? "الوحدات (Modules)" : "Modules"}</h2>
          <p className="sc-hint">
            {lang === "ar"
              ? "كل وحدة هي حزمة مستقلة يمكنها تخصيص الألوان أو إضافة صفحات وعناصر قائمة دون تعديل الكود الأساسي."
              : "Each module is a self-contained package that can restyle the app or add pages and sidebar items without touching core code."}
          </p>
          <div className="sc-modules">
            {modules.map((mod) => {
              const installed = isInstalled(mod.id);
              return (
                <div className="sc-module-card" key={mod.id}>
                  <div className="sc-module-info">
                    <div className="sc-module-name">{mod.name[lang]} <span className="sc-module-version">v{mod.version}</span></div>
                    <div className="sc-module-desc">{mod.description[lang]}</div>
                  </div>
                  <button
                    type="button"
                    className={installed ? "sc-btn sc-btn-danger" : "sc-btn"}
                    onClick={() => (installed ? uninstall(mod.id) : install(mod.id))}
                  >
                    {installed ? (lang === "ar" ? "إلغاء التثبيت" : "Uninstall") : (lang === "ar" ? "تثبيت" : "Install")}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </SkyShell>
  );
}
