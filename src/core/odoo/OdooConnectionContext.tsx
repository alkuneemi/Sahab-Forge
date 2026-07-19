import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { OdooClient } from "./OdooClient";
import type { AiAnalystConfig, OdooApp, OdooConnectionConfig } from "./types";

const CONN_KEY = "sahab_odoo_conn";
const AI_KEY = "sahab_odoo_ai";
const ACTIVATED_KEY = "sahab_odoo_activated";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

interface OdooContextValue {
  config: OdooConnectionConfig;
  setConfig: (c: OdooConnectionConfig) => void;
  aiConfig: AiAnalystConfig;
  setAiConfig: (c: AiAnalystConfig) => void;
  client: OdooClient | null;
  uid: number | null;
  connecting: boolean;
  connectError: string | null;
  connect: () => Promise<void>;
  apps: OdooApp[];
  activatedTechs: string[];
  toggleActivated: (tech: string) => void;
}

const OdooContext = createContext<OdooContextValue | null>(null);

export function OdooConnectionProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<OdooConnectionConfig>(() =>
    readJson(CONN_KEY, { url: "", db: "", username: "", apiKey: "" })
  );
  const [aiConfig, setAiConfigState] = useState<AiAnalystConfig>(() =>
    readJson(AI_KEY, { endpoint: "", apiKey: "" })
  );
  const [activatedTechs, setActivatedTechs] = useState<string[]>(() =>
    readJson(ACTIVATED_KEY, [])
  );

  const [client, setClient] = useState<OdooClient | null>(null);
  const [uid, setUid] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [rawApps, setRawApps] = useState<{ name: string; shortdesc: string; icon: string }[]>([]);

  const setConfig = useCallback((c: OdooConnectionConfig) => {
    setConfigState(c);
    writeJson(CONN_KEY, c);
  }, []);

  const setAiConfig = useCallback((c: AiAnalystConfig) => {
    setAiConfigState(c);
    writeJson(AI_KEY, c);
  }, []);

  const toggleActivated = useCallback((tech: string) => {
    setActivatedTechs((prev) => {
      const next = prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech];
      writeJson(ACTIVATED_KEY, next);
      return next;
    });
  }, []);

  const connect = useCallback(async () => {
    if (!config.url || !config.db || !config.username || !config.apiKey) {
      setConnectError("missing_fields");
      return;
    }
    setConnecting(true);
    setConnectError(null);
    try {
      const authUid = await OdooClient.authenticate(config);
      const c = new OdooClient(config, authUid);
      const apps = await c.fetchInstalledApps();
      setUid(authUid);
      setClient(c);
      setRawApps(apps || []);
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "connection_failed");
      setClient(null);
      setUid(null);
    } finally {
      setConnecting(false);
    }
  }, [config]);

  // Try to silently reconnect once on load if credentials were already saved.
  useEffect(() => {
    if (config.url && config.db && config.username && config.apiKey) {
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baseUrl = config.url.replace(/\/$/, "");
  const apps: OdooApp[] = rawApps.map((m) => ({
    tech: m.name,
    name: m.shortdesc || m.name,
    logo: m.icon ? baseUrl + m.icon : "",
  }));

  const value: OdooContextValue = {
    config,
    setConfig,
    aiConfig,
    setAiConfig,
    client,
    uid,
    connecting,
    connectError,
    connect,
    apps,
    activatedTechs,
    toggleActivated,
  };

  return <OdooContext.Provider value={value}>{children}</OdooContext.Provider>;
}

export function useOdoo() {
  const ctx = useContext(OdooContext);
  if (!ctx) throw new Error("useOdoo must be used within an OdooConnectionProvider");
  return ctx;
}
