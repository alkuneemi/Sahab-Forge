/**
 * Every SAHAB module bundle must call the global registerSahabModule(id, factory)
 * exactly once. This bundle stays self-contained by injecting its UI directly into
 * the host DOM once installed, without importing any host source files.
 */
registerSahabModule("apps-sidebar-injector", () => {
  const SIDEBAR_CLASS = "sahab-apps-left-sidebar";
  const TITLE_CLASS = "sahab-apps-left-sidebar__title";
  const LIST_CLASS = "sahab-apps-left-sidebar__list";
  const ITEM_CLASS = "sahab-apps-left-sidebar__item";
  const ACTIVE_CLASS = "sahab-apps-left-sidebar__item--active";

  let sidebarEl = null;
  let observer = null;
  let lastLabels = [];

  function normalizeLabel(value) {
    return String(value || "")
      .replace(/▾/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function collectLabels() {
    const hostBar = document.querySelector(".menubar");
    if (!hostBar) return [];

    const seen = new Set();
    const labels = Array.from(hostBar.querySelectorAll(".mb-btn, .mb-link"))
      .map((node) => normalizeLabel(node.textContent))
      .filter((label) => label && !seen.has(label) && seen.add(label));

    return labels;
  }

  function removeSidebar() {
    sidebarEl?.remove();
    sidebarEl = null;
  }

  function setActiveItem(label) {
    if (!sidebarEl) return;
    const items = Array.from(sidebarEl.querySelectorAll(`.${ITEM_CLASS}`));
    items.forEach((item) => {
      item.classList.toggle(ACTIVE_CLASS.replace("sahab-apps-left-sidebar__item--active", "sahab-apps-left-sidebar__item--active"), item.dataset.label === label);
    });
  }

  function buildSidebar(labels) {
    if (!labels.length) {
      removeSidebar();
      return;
    }

    if (!sidebarEl) {
      sidebarEl = document.createElement("aside");
      sidebarEl.className = SIDEBAR_CLASS;
      sidebarEl.setAttribute("aria-label", "Apps menu sidebar");

      const target = document.querySelector(".aw-body");
      if (target) {
        target.insertBefore(sidebarEl, target.firstChild);
      } else {
        document.body.appendChild(sidebarEl);
      }
    }

    const header = document.createElement("div");
    header.className = TITLE_CLASS;
    header.textContent = "App menu";

    const list = document.createElement("div");
    list.className = LIST_CLASS;

    labels.forEach((label) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = ITEM_CLASS;
      item.dataset.label = label;
      item.textContent = label;
      item.addEventListener("click", () => {
        const match = Array.from(document.querySelectorAll(".menubar .mb-btn, .menubar .mb-link")).find((node) => normalizeLabel(node.textContent) === label);
        if (match) {
          match.click();
          setActiveItem(label);
        }
      });
      list.appendChild(item);
    });

    sidebarEl.innerHTML = "";
    sidebarEl.appendChild(header);
    sidebarEl.appendChild(list);
    lastLabels = labels;
  }

  function syncSidebar() {
    const pathname = window.location.pathname || "";
    const isAppsRoute = /^\/apps\//.test(pathname);

    if (!isAppsRoute) {
      removeSidebar();
      return;
    }

    const labels = collectLabels();
    if (!labels.length) {
      removeSidebar();
      return;
    }

    const shouldRebuild = labels.join("\n") !== lastLabels.join("\n");
    if (shouldRebuild) buildSidebar(labels);
    else if (!sidebarEl) buildSidebar(labels);
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(() => {
      window.requestAnimationFrame(syncSidebar);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function stopObserver() {
    observer?.disconnect();
    observer = null;
  }

  startObserver();
  window.addEventListener("popstate", syncSidebar);
  window.addEventListener("load", syncSidebar);
  window.setTimeout(syncSidebar, 150);
  window.setInterval(syncSidebar, 1800);

  return {
    id: "apps-sidebar-injector",
    name: { ar: "مُحقّق الشريط الجانبي", en: "App Sidebar Injector" },
    description: { ar: "يضيف شريطاً جانبياً على صفحات /apps/:tech باستخدام أسماء القوائم الظاهرة بالفعل.", en: "Adds a left sidebar on /apps/:tech pages using the visible app menu labels." },
    version: "1.0.0",
    styleOverrides: `
      .${SIDEBAR_CLASS} {
        position: sticky;
        top: 16px;
        align-self: flex-start;
        width: 220px;
        max-height: calc(100vh - 32px);
        overflow: auto;
        padding: 12px;
        margin-right: 16px;
        border: 1px solid rgba(15, 23, 42, 0.08);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
        backdrop-filter: blur(8px);
      }
      .${TITLE_CLASS} {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--color-text-muted, #64748b);
        margin-bottom: 10px;
      }
      .${LIST_CLASS} {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .${ITEM_CLASS} {
        border: 0;
        border-radius: 10px;
        padding: 8px 10px;
        text-align: left;
        background: transparent;
        color: var(--color-text, #0f172a);
        cursor: pointer;
        font-size: 13px;
        line-height: 1.4;
      }
      .${ITEM_CLASS}:hover {
        background: rgba(59, 130, 246, 0.1);
      }
      .${ITEM_CLASS}.${ACTIVE_CLASS} {
        background: rgba(59, 130, 246, 0.16);
        color: var(--color-primary, #2563eb);
        font-weight: 700;
      }
      .dashboard-frame .aw-body {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }
      .dashboard-frame .aw-area {
        flex: 1 1 auto;
        min-width: 0;
      }
      @media (max-width: 980px) {
        .${SIDEBAR_CLASS} {
          display: none;
        }
        .dashboard-frame .aw-body {
          display: block;
        }
      }
      body[dir="rtl"] .${SIDEBAR_CLASS} {
        margin-left: 16px;
        margin-right: 0;
      }
    `,
  };
});
