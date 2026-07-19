import React from "react";
import type { SahabModule } from "../types";

export type ModuleFactory = (sdk: typeof sahabSdk) => SahabModule;

/**
 * Exposed globally (see main.tsx) so a module bundle built completely
 * outside this repo can register itself without bundling its own copy of
 * React (which would break rendering) and without ever seeing our source.
 * Keep this surface small and stable — it is the entire contract external
 * developers build against.
 */
export const sahabSdk = {
  React,
};

declare global {
  interface Window {
    SahabSDK: typeof sahabSdk;
    registerSahabModule: (id: string, factory: ModuleFactory) => void;
    __sahabPendingRegistrations?: Record<string, (mod: SahabModule) => void>;
  }
}

export function installSdkGlobals() {
  window.SahabSDK = sahabSdk;
  window.__sahabPendingRegistrations = window.__sahabPendingRegistrations || {};
  window.registerSahabModule = (id, factory) => {
    const mod = factory(sahabSdk);
    window.__sahabPendingRegistrations?.[id]?.(mod);
  };
}
