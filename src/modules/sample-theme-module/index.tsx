import React from "react";
import type { SahabModule } from "../../core/modules/types";

/**
 * SAMPLE MODULE — read this file as the template for building new ones.
 *
 * A module is just an object matching `SahabModule`. To ship a new
 * module for SAHAB ERP:
 *
 *   1. Create a folder under src/modules/<your-module-id>/.
 *   2. Export a `SahabModule` object from its index.tsx (this file is
 *      the example).
 *   3. Add it to the `availableModules` array in src/modules/registry.ts.
 *   4. That's it — it now shows up in System Control (/system-control)
 *      with an Install button. Nothing else in the codebase changes.
 *
 * While installed, this particular module:
 *   - Re-themes the whole app from blue to purple by overriding the
 *     shared CSS variables declared in src/styles/globals.css.
 *   - Adds a "Sample Module" link to the dashboard sidebar.
 *   - Mounts a demo page at /modules/sample-theme.
 *   - Adds one extra translation key used by the sidebar link.
 *
 * Uninstalling removes all of the above and the app returns to its
 * original look — nothing is hand-reverted, the style tag is simply
 * removed and the merged dictionary/routes/sidebar recompute
 * automatically because they are derived state.
 */

function SampleModulePage() {
  return (
    <div style={{ padding: 32, maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 12 }}>Sample Theme Module</h1>
      <p style={{ color: "var(--color-text-muted)", lineHeight: 1.8 }}>
        This page, the purple accent color, and the sidebar link that
        brought you here all came from a single module file at{" "}
        <code>src/modules/sample-theme-module/index.tsx</code>. Uninstall
        the module from System Control and all three disappear together.
      </p>
    </div>
  );
}

export const sampleThemeModule: SahabModule = {
  id: "sample-theme-module",
  name: { ar: "وحدة الثيم التجريبية", en: "Sample Theme Module" },
  description: {
    ar: "مثال جاهز يوضح كيفية تخصيص الألوان وإضافة صفحة وعنصر قائمة عبر نظام الوحدات.",
    en: "A ready-made example showing how to re-theme, add a page, and add a sidebar item through the module system.",
  },
  version: "1.0.0",
  styleOverrides: `
    :root {
      --color-primary: #7c3aed;
      --color-primary-dark: #6d28d9;
      --color-accent-1: #a855f7;
    }
  `,
  translations: {
    ar: { modules_link: "الوحدة التجريبية" },
    en: { modules_link: "Sample Module" },
  },
  sidebarItems: [
    {
      id: "sample-theme-module-link",
      labelKey: "modules_link",
      path: "/modules/sample-theme",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" />
        </svg>
      ),
    },
  ],
  routes: [{ path: "/modules/sample-theme", element: <SampleModulePage /> }],
};
