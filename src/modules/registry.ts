import type { SahabModule } from "../core/modules/types";
import { sampleThemeModule } from "./sample-theme-module";

const LOCAL_FORGE_MODULES_KEY = "sahab_local_forge_modules";

function readLocalForgeModules(): SahabModule[] {
  try {
    const raw = localStorage.getItem(LOCAL_FORGE_MODULES_KEY);
    return raw ? (JSON.parse(raw) as SahabModule[]) : [];
  } catch {
    return [];
  }
}

/**
 * Every module the app knows how to install lives in this array.
 * Adding a module to the product is a one-line change here — see
 * src/modules/sample-theme-module/index.tsx for the full guide on
 * building one.
 */
export function getAvailableModules(): SahabModule[] {
  return [sampleThemeModule, ...readLocalForgeModules()];
}

export const availableModules: SahabModule[] = getAvailableModules();
