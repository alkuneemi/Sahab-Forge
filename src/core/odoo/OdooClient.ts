import type { OdooConnectionConfig } from "./types";

/**
 * VITE_ODOO_PROXY_URL controls how the browser reaches Odoo's /jsonrpc:
 *  - unset (default): same-origin "/odoo-proxy" — handled by the Vite dev
 *    proxy below, or by server/odoo-proxy.mjs in production. Works for any
 *    Odoo server entered in Settings; nothing here is tenant-specific.
 *  - "direct": call {odoo url}/jsonrpc straight from the browser — only
 *    works if that Odoo server already sends CORS headers for this origin.
 *  - any other value: used as the proxy's base URL (e.g. a proxy deployed
 *    on its own domain, https://proxy.example.com).
 */
const PROXY_BASE: string = (import.meta.env.VITE_ODOO_PROXY_URL as string | undefined) ?? "/odoo-proxy";

/**
 * Talks to Odoo's external API exactly like the original workflow did:
 * POST {url}/jsonrpc with {service:"common"|"object", method, args}. Routed
 * through a same-origin proxy by default so Odoo's CORS policy never blocks
 * it (see PROXY_BASE above for how to change that).
 */
async function rpc(baseUrl: string, service: string, method: string, args: unknown[]) {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const direct = PROXY_BASE === "direct";
  const res = await fetch(direct ? `${cleanBase}/jsonrpc` : `${PROXY_BASE}/jsonrpc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(direct ? {} : { "X-Odoo-Base-Url": cleanBase }),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Odoo proxy HTTP ${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.data?.message || data.error.message || "Odoo RPC error");
  }
  return data.result;
}

export class OdooClient {
  constructor(private config: OdooConnectionConfig, private uid: number) {}

  static async authenticate(config: OdooConnectionConfig): Promise<number> {
    const uid = await rpc(config.url, "common", "authenticate", [
      config.db,
      config.username,
      config.apiKey,
      {},
    ]);
    if (!uid || typeof uid !== "number") throw new Error("authentication_failed");
    return uid;
  }

  private executeKw(model: string, method: string, args: unknown[] = [], kwargs: Record<string, unknown> = {}) {
    return rpc(this.config.url, "object", "execute_kw", [
      this.config.db,
      this.uid,
      this.config.apiKey,
      model,
      method,
      args,
      kwargs,
    ]);
  }

  /** Public escape hatch for calling any model method not wrapped above (e.g. a form's action buttons). */
  callMethod(model: string, method: string, args: unknown[] = [], kwargs: Record<string, unknown> = {}) {
    return this.executeKw(model, method, args, kwargs);
  }

  searchRead(model: string, domain: unknown[] = [], opts: Record<string, unknown> = {}) {
    return this.executeKw(model, "search_read", [domain], opts);
  }

  read(model: string, ids: number[], fields?: string[]) {
    return this.executeKw(model, "read", [ids], fields ? { fields } : {});
  }

  /**
   * Odoo 17+ removed `fields_view_get` in favor of `get_views`. We try the
   * modern method first and fall back automatically for older servers, so
   * this works across Odoo 13–18 without any configuration.
   */
  async getView(model: string, viewType: "form" | "tree" | "list"): Promise<{ arch: string; fields: Record<string, unknown> }> {
    const newType = viewType === "tree" ? "list" : viewType;
    try {
      const result = await this.executeKw(
        model,
        "get_views",
        [[[false, newType]]],
        {}
      );
      const view = result.views[newType];
      return { arch: view.arch, fields: result.fields };
    } catch {
      const oldType = viewType === "list" ? "tree" : viewType;
      const result = await this.executeKw(model, "fields_view_get", [], { view_type: oldType });
      return { arch: result.arch, fields: result.fields };
    }
  }

  /** Powers the many2one/many2many "type to search" pickers, exactly like Odoo's own UI. */
  nameSearch(model: string, query: string, domain: unknown[] = [], limit = 8): Promise<[number, string][]> {
    return this.executeKw(model, "name_search", [query, domain, "ilike", limit]);
  }

  fetchInstalledApps() {
    return this.executeKw("ir.module.module", "search_read", [
      [
        ["state", "=", "installed"],
        ["application", "=", true],
      ],
    ], { fields: ["name", "shortdesc", "icon"], limit: 100 });
  }

  /**
   * Returns this app's full menu tree, built exactly the way Odoo's own web
   * client would show it: find the root menu whose name matches the app
   * (fuzzy), pull every descendant via child_of, resolve each leaf's action
   * to its model, then prune branches that lead nowhere. Order follows
   * Odoo's own `sequence` field throughout.
   */
  async getAppMenuTree(appName: string): Promise<MenuNode[]> {
    const roots = await this.searchRead("ir.ui.menu", [["parent_id", "=", false]], { fields: ["name"] });
    const norm = (s: string) => (s || "").trim().toLowerCase();
    const target = norm(appName);
    const root =
      (roots as { id: number; name: string }[]).find((r) => norm(r.name) === target) ||
      (roots as { id: number; name: string }[]).find(
        (r) => norm(r.name).includes(target) || target.includes(norm(r.name))
      );
    if (!root) return [];

    const nodes = await this.searchRead("ir.ui.menu", [["id", "child_of", root.id]], {
      fields: ["name", "action", "parent_id", "sequence"],
    });
    const parseActionId = (action: unknown): number | null => {
      if (typeof action === "string" && action.includes(",")) return parseInt(action.split(",")[1], 10);
      if (Array.isArray(action)) return action[0] as number;
      return null;
    };
    const actionIds = (nodes as { action: unknown }[]).map((n) => parseActionId(n.action)).filter((x): x is number => !!x);
    const acts = actionIds.length ? await this.read("ir.actions.act_window", actionIds, ["res_model", "name"]) : [];
    const actMap = new Map<number, { res_model: string; name: string }>((acts as { id: number; res_model: string; name: string }[]).map((a) => [a.id, a]));

    const byId = new Map<number, MenuNode>();
    for (const n of nodes as { id: number; name: string; action: unknown; parent_id: [number, string] | false; sequence: number }[]) {
      const aid = parseActionId(n.action);
      const act = aid ? actMap.get(aid) : undefined;
      const parent = n.parent_id ? n.parent_id[0] : null;
      byId.set(n.id, { id: n.id, name: n.name, seq: n.sequence || 0, parent, model: act?.res_model ?? null, children: [] });
    }
    if (!byId.has(root.id)) byId.set(root.id, { id: root.id, name: root.name, seq: 0, parent: null, model: null, children: [] });
    for (const [id, nd] of byId) {
      if (id === root.id) continue;
      const parent = nd.parent !== null && byId.has(nd.parent) ? byId.get(nd.parent)! : byId.get(root.id)!;
      parent.children.push(nd);
    }
    const keep = (nd: MenuNode): boolean => {
      nd.children = nd.children.filter(keep).sort((a, b) => a.seq - b.seq);
      return !!nd.model || nd.children.length > 0;
    };
    keep(byId.get(root.id)!);
    return byId.get(root.id)!.children;
  }

  fieldsGet(model: string) {
    return this.executeKw(model, "fields_get", [], {
      attributes: ["string", "type", "selection", "required", "relation"],
    });
  }

  messagePost(model: string, id: number, body: string) {
    return this.executeKw(model, "message_post", [[id]], { body, message_type: "comment" });
  }

  getMessages(model: string, id: number) {
    return this.searchRead(
      "mail.message",
      [["model", "=", model], ["res_id", "=", id]],
      { fields: ["author_id", "body", "date", "message_type", "subject"], limit: 60, order: "date desc" }
    );
  }

  unlink(model: string, ids: number[]) {
    return this.executeKw(model, "unlink", [ids]);
  }

  write(model: string, ids: number[], values: Record<string, unknown>) {
    return this.executeKw(model, "write", [ids, values]);
  }

  create(model: string, values: Record<string, unknown>) {
    return this.executeKw(model, "create", [values]);
  }
}

export interface MenuNode {
  id: number;
  name: string;
  seq: number;
  parent: number | null;
  model: string | null;
  children: MenuNode[];
}
