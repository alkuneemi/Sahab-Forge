import type { ReactNode } from "react";
import type { TranslationPack } from "../i18n/types";

/** An extra entry a module wants to add to the dashboard sidebar. */
export interface ModuleSidebarItem {
  id: string;
  labelKey: string; // translation key, resolved with useI18n().t()
  icon: ReactNode;
  path: string;
}

/** An extra route a module wants to mount while it is installed. */
export interface ModuleRoute {
  path: string; // relative to "/"
  element: ReactNode;
}

/**
 * The contract every module implements. A module is pure data + optional
 * React content — the core app never imports a module's internals
 * directly, it only talks to this interface. That is what makes modules
 * pluggable: dropping a new folder under src/modules and registering it
 * in src/modules/registry.ts is the entire integration surface.
 */
export interface SahabModule {
  id: string;
  name: Record<"ar" | "en", string>;
  description: Record<"ar" | "en", string>;
  version: string;

  /**
   * Raw CSS injected into <head> as a <style> tag while the module is
   * installed. Because it is appended after the base stylesheet, its
   * rules win on equal specificity — the classic "theme inheritance"
   * mechanism. Removing the tag on uninstall restores the original
   * design instantly, with zero changes to core files.
   */
  styleOverrides?: string;

  /** Extra / overriding translation keys contributed while installed. */
  translations?: TranslationPack;

  /** Extra sidebar links shown on the dashboard while installed. */
  sidebarItems?: ModuleSidebarItem[];

  /** Extra routes mounted while installed. */
  routes?: ModuleRoute[];
}
