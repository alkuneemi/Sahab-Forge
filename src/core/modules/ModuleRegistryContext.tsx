import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ModuleRoute, ModuleSidebarItem, SahabModule } from "./types";
import type { GitHubSourceConfig } from "./remote/types";
import { useI18n } from "../i18n/I18nContext";
import { getAvailableModules } from "../../modules/registry";
import { cdnUrl, fetchManifest } from "./remote/githubSource";
import { loadRemoteModuleBundle } from "./remote/loadRemoteModule";

const STORAGE_KEY = "sahab_installed_modules";
const SOURCE_KEY = "sahab_module_github_source";
const STYLE_TAG_PREFIX = "sahab-module-style-";

function readInstalledIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function writeInstalledIds(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}
function readSource(): GitHubSourceConfig | null {
  try {
    const raw = localStorage.getItem(SOURCE_KEY);
    return raw ? (JSON.parse(raw) as GitHubSourceConfig) : null;
  } catch {
    return null;
  }
}

interface ModuleRegistryContextValue {
  modules: SahabModule[]; // local + remote, combined
  installedIds: string[];
  isInstalled: (id: string) => boolean;
  install: (id: string) => void;
  uninstall: (id: string) => void;
  sidebarItems: ModuleSidebarItem[];
  routes: ModuleRoute[];
  // External developer repository (GitHub marketplace)
  source: GitHubSourceConfig | null;
  connectSource: (source: GitHubSourceConfig) => Promise<void>;
  disconnectSource: () => void;
  sourceLoading: boolean;
  sourceError: string | null;
}

const ModuleRegistryContext = createContext<ModuleRegistryContextValue | null>(null);

export function ModuleRegistryProvider({ children }: { children: React.ReactNode }) {
  const { registerDictionary, unregisterDictionary } = useI18n();
  const [installedIds, setInstalledIds] = useState<string[]>(readInstalledIds);
  const [source, setSource] = useState<GitHubSourceConfig | null>(readSource);
  const [remoteModules, setRemoteModules] = useState<SahabModule[]>([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);

  const allModules = useMemo(() => [...getAvailableModules(), ...remoteModules], [remoteModules]);

  const applyModuleSideEffects = useCallback(
    (mod: SahabModule) => {
      if (mod.styleOverrides) {
        const tagId = STYLE_TAG_PREFIX + mod.id;
        let styleTag = document.getElementById(tagId) as HTMLStyleElement | null;
        if (!styleTag) {
          styleTag = document.createElement("style");
          styleTag.id = tagId;
          document.head.appendChild(styleTag);
        }
        styleTag.textContent = mod.styleOverrides;
      }
      if (mod.translations) registerDictionary(mod.id, mod.translations);
    },
    [registerDictionary]
  );

  const revertModuleSideEffects = useCallback(
    (mod: SahabModule) => {
      const styleTag = document.getElementById(STYLE_TAG_PREFIX + mod.id);
      if (styleTag) styleTag.remove();
      if (mod.translations) unregisterDictionary(mod.id);
    },
    [unregisterDictionary]
  );

  const connectSource = useCallback(async (cfg: GitHubSourceConfig) => {
    setSourceLoading(true);
    setSourceError(null);
    try {
      const manifest = await fetchManifest(cfg);
      const loaded = await Promise.all(
        manifest.modules.map((entry) =>
          loadRemoteModuleBundle(entry.id, cdnUrl(cfg, entry.entry)).then((mod) => ({
            ...mod,
            id: entry.id,
            name: entry.name,
            description: entry.description,
            version: entry.version,
          }))
        )
      );
      setRemoteModules(loaded);
      setSource(cfg);
      try {
        localStorage.setItem(SOURCE_KEY, JSON.stringify(cfg));
      } catch {
        /* ignore */
      }
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : "source_connect_failed");
    } finally {
      setSourceLoading(false);
    }
  }, []);

  const disconnectSource = useCallback(() => {
    // Uninstall any remote modules first so their styles/translations are reverted cleanly.
    for (const mod of remoteModules) {
      if (installedIds.includes(mod.id)) revertModuleSideEffects(mod);
    }
    setInstalledIds((prev) => {
      const next = prev.filter((id) => !remoteModules.some((m) => m.id === id));
      writeInstalledIds(next);
      return next;
    });
    setRemoteModules([]);
    setSource(null);
    try {
      localStorage.removeItem(SOURCE_KEY);
    } catch {
      /* ignore */
    }
  }, [remoteModules, installedIds, revertModuleSideEffects]);

  // Reconnect + re-apply installed modules' side effects once on load.
  useEffect(() => {
    const saved = readSource();
    if (saved) connectSource(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    for (const id of installedIds) {
      const mod = allModules.find((m) => m.id === id);
      if (mod) applyModuleSideEffects(mod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allModules]);

  const install = useCallback(
    (id: string) => {
      const mod = allModules.find((m) => m.id === id);
      if (!mod) return;
      applyModuleSideEffects(mod);
      setInstalledIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        writeInstalledIds(next);
        return next;
      });
    },
    [allModules, applyModuleSideEffects]
  );

  const uninstall = useCallback(
    (id: string) => {
      const mod = allModules.find((m) => m.id === id);
      if (!mod) return;
      revertModuleSideEffects(mod);
      setInstalledIds((prev) => {
        const next = prev.filter((existing) => existing !== id);
        writeInstalledIds(next);
        return next;
      });
    },
    [allModules, revertModuleSideEffects]
  );

  const isInstalled = useCallback((id: string) => installedIds.includes(id), [installedIds]);

  const installedModules = useMemo(
    () => allModules.filter((m) => installedIds.includes(m.id)),
    [allModules, installedIds]
  );

  const sidebarItems = useMemo(
    () => installedModules.flatMap((m) => m.sidebarItems ?? []),
    [installedModules]
  );
  const routes = useMemo(() => installedModules.flatMap((m) => m.routes ?? []), [installedModules]);

  const value: ModuleRegistryContextValue = {
    modules: allModules,
    installedIds,
    isInstalled,
    install,
    uninstall,
    sidebarItems,
    routes,
    source,
    connectSource,
    disconnectSource,
    sourceLoading,
    sourceError,
  };

  return <ModuleRegistryContext.Provider value={value}>{children}</ModuleRegistryContext.Provider>;
}

export function useModuleRegistry() {
  const ctx = useContext(ModuleRegistryContext);
  if (!ctx) throw new Error("useModuleRegistry must be used within a ModuleRegistryProvider");
  return ctx;
}
