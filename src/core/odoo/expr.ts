/**
 * Odoo 17+ writes view conditions as small Python boolean expressions
 * directly in the XML, e.g.:
 *   invisible="state != 'draft'"
 *   invisible="not has_authorized_transaction_ids"
 *   invisible="state not in ['draft', 'sent', 'sale'] or not id or locked"
 *   readonly="qty_invoiced &gt; 0"   (DOMParser already unescapes &gt; to > for us)
 *
 * This is a small, safe (no eval/new Function) recursive-descent evaluator
 * covering exactly the grammar Odoo views actually use: identifiers (field
 * names, resolved against the current record), string/number/bool/None
 * literals, list literals, comparisons (== != < <= > >=), membership
 * (in / not in), and boolean logic (and / or / not) with parentheses.
 */

type Token = { type: string; value: string };

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const isIdStart = (c: string) => /[A-Za-z_]/.test(c);
  const isIdChar = (c: string) => /[A-Za-z0-9_.]/.test(c);
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "'" || c === '"') {
      const quote = c;
      let j = i + 1;
      let str = "";
      while (j < src.length && src[j] !== quote) {
        str += src[j];
        j++;
      }
      tokens.push({ type: "string", value: str });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      let num = "";
      while (j < src.length && /[0-9.]/.test(src[j])) {
        num += src[j];
        j++;
      }
      tokens.push({ type: "number", value: num });
      i = j;
      continue;
    }
    if (isIdStart(c)) {
      let j = i;
      let id = "";
      while (j < src.length && isIdChar(src[j])) {
        id += src[j];
        j++;
      }
      tokens.push({ type: "id", value: id });
      i = j;
      continue;
    }
    if ("()[],".includes(c)) {
      tokens.push({ type: c, value: c });
      i++;
      continue;
    }
    if (c === "=" && src[i + 1] === "=") {
      tokens.push({ type: "==", value: "==" });
      i += 2;
      continue;
    }
    if (c === "!" && src[i + 1] === "=") {
      tokens.push({ type: "!=", value: "!=" });
      i += 2;
      continue;
    }
    if (c === ">" && src[i + 1] === "=") {
      tokens.push({ type: ">=", value: ">=" });
      i += 2;
      continue;
    }
    if (c === "<" && src[i + 1] === "=") {
      tokens.push({ type: "<=", value: "<=" });
      i += 2;
      continue;
    }
    if (c === ">" || c === "<") {
      tokens.push({ type: c, value: c });
      i++;
      continue;
    }
    // unknown character (e.g. stray punctuation) — skip it rather than fail
    i++;
  }
  return tokens;
}

class Parser {
  pos = 0;
  constructor(private tokens: Token[], private record: Record<string, unknown>) {}

  private peek() {
    return this.tokens[this.pos];
  }
  private next() {
    return this.tokens[this.pos++];
  }
  private eat(type: string) {
    const t = this.next();
    if (!t || t.type !== type) throw new Error(`expr: expected ${type}`);
    return t;
  }

  parseExpr(): unknown {
    return this.parseOr();
  }

  private parseOr(): unknown {
    let left = this.parseAnd();
    while (this.peek()?.type === "id" && this.peek()?.value === "or") {
      this.next();
      const right = this.parseAnd();
      left = truthy(left) || truthy(right);
    }
    return left;
  }

  private parseAnd(): unknown {
    let left = this.parseNot();
    while (this.peek()?.type === "id" && this.peek()?.value === "and") {
      this.next();
      const right = this.parseNot();
      left = truthy(left) && truthy(right);
    }
    return left;
  }

  private parseNot(): unknown {
    if (this.peek()?.type === "id" && this.peek()?.value === "not") {
      this.next();
      return !truthy(this.parseNot());
    }
    return this.parseComparison();
  }

  private parseComparison(): unknown {
    const left = this.parseAtom();
    const t = this.peek();
    if (t && ["==", "!=", ">", "<", ">=", "<="].includes(t.type)) {
      this.next();
      const right = this.parseAtom();
      return compare(t.type, left, right);
    }
    if (t?.type === "id" && t.value === "in") {
      this.next();
      const right = this.parseAtom();
      return Array.isArray(right) ? right.includes(left) : false;
    }
    if (t?.type === "id" && t.value === "not" && this.tokens[this.pos + 1]?.value === "in") {
      this.next();
      this.next();
      const right = this.parseAtom();
      return Array.isArray(right) ? !right.includes(left) : true;
    }
    return left;
  }

  private parseAtom(): unknown {
    const t = this.next();
    if (!t) return undefined;
    if (t.type === "(") {
      const v = this.parseOr();
      this.eat(")");
      return v;
    }
    if (t.type === "[") {
      const items: unknown[] = [];
      if (this.peek()?.type !== "]") {
        items.push(this.parseOr());
        while (this.peek()?.type === ",") {
          this.next();
          items.push(this.parseOr());
        }
      }
      this.eat("]");
      return items;
    }
    if (t.type === "string") return t.value;
    if (t.type === "number") return parseFloat(t.value);
    if (t.type === "id") {
      if (t.value === "True") return true;
      if (t.value === "False") return false;
      if (t.value === "None") return null;
      if (t.value === "not") return !truthy(this.parseNot());
      // field/context reference — read from the current record
      return fieldRef(this.record, t.value);
    }
    return undefined;
  }
}

function fieldRef(record: Record<string, unknown>, path: string): unknown {
  // Odoo expressions sometimes reference "parent.xxx" inside sub-forms; we
  // don't have that context here, so treat unresolved refs as falsy rather
  // than throwing — better to show a field than to crash the whole form.
  if (path.startsWith("parent.")) return undefined;
  const v = record[path];
  if (Array.isArray(v) && v.length === 2 && typeof v[1] === "string") return v[0]; // many2one -> id for comparisons
  return v;
}

function truthy(v: unknown): boolean {
  if (Array.isArray(v)) return v.length > 0;
  return Boolean(v);
}

function compare(op: string, a: unknown, b: unknown): boolean {
  switch (op) {
    case "==":
      return a === b;
    case "!=":
      return a !== b;
    case ">":
      return (a as number) > (b as number);
    case "<":
      return (a as number) < (b as number);
    case ">=":
      return (a as number) >= (b as number);
    case "<=":
      return (a as number) <= (b as number);
    default:
      return false;
  }
}

/** Evaluates one Odoo view expression string against a record. Never throws. */
export function evalOdooExpr(expr: string, record: Record<string, unknown>): boolean {
  if (!expr) return false;
  if (expr === "1" || expr === "True") return true;
  if (expr === "0" || expr === "False") return false;
  try {
    const tokens = tokenize(expr);
    const parser = new Parser(tokens, record);
    return truthy(parser.parseExpr());
  } catch {
    // Unparseable expression (rare/unsupported grammar) — default to not
    // hiding/blocking the field, since that's the safer failure mode.
    return false;
  }
}
