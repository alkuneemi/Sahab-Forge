export interface OdooConnectionConfig {
  url: string;
  db: string;
  username: string;
  apiKey: string;
}

export interface OdooSession {
  uid: number;
}

export interface OdooApp {
  tech: string; // ir.module.module "name" (e.g. "sale")
  name: string; // shortdesc
  logo: string;
}

export interface AiAnalystConfig {
  /** Webhook/HTTP endpoint that accepts { model, label, count, payload, lang } and returns an HTML fragment. */
  endpoint: string;
  apiKey?: string;
}

/** One node of a parsed Odoo view <arch>: form/sheet/group/notebook/page/field/... */
export interface ArchNode {
  tag: string;
  attrs: Record<string, string>;
  children: ArchNode[];
  text?: string;
}

export interface Modifiers {
  invisible?: boolean;
  readonly?: boolean;
  required?: boolean;
}
