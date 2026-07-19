import type { SahabModule } from "../types";
import "./sdk"; // ensures the Window type augmentation is in scope

const SCRIPT_TAG_PREFIX = "sahab-remote-module-";

export function loadRemoteModuleBundle(id: string, scriptUrl: string): Promise<SahabModule> {
  return new Promise((resolve, reject) => {
    window.__sahabPendingRegistrations = window.__sahabPendingRegistrations || {};
    window.__sahabPendingRegistrations[id] = resolve;

    const existing = document.getElementById(SCRIPT_TAG_PREFIX + id);
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = SCRIPT_TAG_PREFIX + id;
    script.src = scriptUrl;
    script.async = true;
    script.onerror = () => reject(new Error(`remote_module_load_failed:${id}`));
    document.head.appendChild(script);

    const timeout = setTimeout(() => reject(new Error(`remote_module_timeout:${id}`)), 15000);
    const originalResolve = window.__sahabPendingRegistrations[id];
    window.__sahabPendingRegistrations[id] = (mod) => {
      clearTimeout(timeout);
      originalResolve(mod);
    };
  });
}
