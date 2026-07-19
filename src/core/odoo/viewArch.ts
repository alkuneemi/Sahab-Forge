import type { ArchNode, Modifiers } from "./types";
import { evalOdooExpr } from "./expr";

export function parseArch(archXml: string): ArchNode {
  const doc = new DOMParser().parseFromString(archXml, "text/xml");
  return elementToNode(doc.documentElement);
}

function elementToNode(el: Element): ArchNode {
  const attrs: Record<string, string> = {};
  for (const a of Array.from(el.attributes)) attrs[a.name] = a.value;
  const children: ArchNode[] = [];
  for (const child of Array.from(el.children)) children.push(elementToNode(child));
  return { tag: el.tagName.toLowerCase(), attrs, children };
}

/** Evaluates a (simplified) Odoo domain, e.g. [["state","=","draft"],["amount",">",0]]. */
export function evalDomain(domain: unknown, record: Record<string, unknown>): boolean {
  if (!Array.isArray(domain) || domain.length === 0) return false;
  // Build boolean results for each leaf, then fold logical prefix ops right-to-left.
  const stack: boolean[] = [];
  const ops: string[] = [];
  for (const item of domain as unknown[]) {
    if (item === "&" || item === "|" || item === "!") {
      ops.push(item as string);
      continue;
    }
    if (!Array.isArray(item) || item.length !== 3) continue;
    const [field, op, value] = item as [string, string, unknown];
    stack.push(evalLeaf(record[field], op, value));
  }
  while (ops.length) {
    const op = ops.pop()!;
    if (op === "!") {
      const a = stack.pop();
      if (a !== undefined) stack.push(!a);
    } else {
      const a = stack.pop();
      const b = stack.pop();
      if (a !== undefined && b !== undefined) {
        stack.push(op === "&" ? a && b : a || b);
      }
    }
  }
  return stack.length ? stack.reduce((acc, v) => acc && v, true) : false;
}

function evalLeaf(fieldVal: unknown, op: string, value: unknown): boolean {
  switch (op) {
    case "=":
    case "==":
      return fieldVal === value;
    case "!=":
      return fieldVal !== value;
    case ">":
      return (fieldVal as number) > (value as number);
    case ">=":
      return (fieldVal as number) >= (value as number);
    case "<":
      return (fieldVal as number) < (value as number);
    case "<=":
      return (fieldVal as number) <= (value as number);
    case "in":
      return Array.isArray(value) && value.includes(fieldVal);
    case "not in":
      return Array.isArray(value) && !value.includes(fieldVal);
    default:
      return false;
  }
}

/** Resolves invisible/readonly/required for a node against the current record. */
export function resolveModifiers(node: ArchNode, record: Record<string, unknown>): Modifiers {
  const result: Modifiers = {};

  // Odoo 17+: invisible/readonly/required hold a direct Python-ish boolean
  // expression string ("state != 'draft'", "not id", "1", "0", ...).
  // A plain "1"/"true" is handled by evalOdooExpr too, so this single path
  // covers both the always-on and the conditional cases.
  (["invisible", "readonly", "required"] as const).forEach((key) => {
    const attr = node.attrs[key];
    if (attr != null) result[key] = evalOdooExpr(attr, record);
  });

  // Legacy fallback (Odoo <17): modifiers="{...}" / attrs="{...}" JSON blob.
  const raw = node.attrs.modifiers || node.attrs.attrs;
  if (raw) {
    try {
      const parsed = JSON.parse(raw.replace(/'/g, '"'));
      (["invisible", "readonly", "required"] as const).forEach((key) => {
        if (result[key]) return; // direct attribute already decided this
        const v = parsed[key];
        if (v === true) result[key] = true;
        else if (Array.isArray(v)) result[key] = evalDomain(v, record);
      });
    } catch {
      /* unparseable legacy modifiers -> leave as already resolved above */
    }
  }

  return result;
}
