export interface FieldMeta {
  type?: string;
  string?: string;
  selection?: [string, string][];
  required?: boolean;
  relation?: string;
}
export type FieldsMeta = Record<string, FieldMeta>;

const STATE_COLORS: Record<string, { bg: string; fg: string }> = {
  draft: { bg: "#eef2ff", fg: "#3730a3" },
  sent: { bg: "#e0f2fe", fg: "#075985" },
  sale: { bg: "#dcfce7", fg: "#166534" },
  done: { bg: "#dcfce7", fg: "#166534" },
  posted: { bg: "#dcfce7", fg: "#166534" },
  paid: { bg: "#dcfce7", fg: "#166534" },
  confirmed: { bg: "#dcfce7", fg: "#166534" },
  open: { bg: "#fef9c3", fg: "#854d0e" },
  pending: { bg: "#fef9c3", fg: "#854d0e" },
  to_approve: { bg: "#fef9c3", fg: "#854d0e" },
  cancel: { bg: "#fee2e2", fg: "#b91c1c" },
  cancelled: { bg: "#fee2e2", fg: "#b91c1c" },
  refused: { bg: "#fee2e2", fg: "#b91c1c" },
  error: { bg: "#fee2e2", fg: "#b91c1c" },
};

export function formatCell(value: unknown, field: string, meta?: FieldMeta) {
  if (value == null || value === false) return <span className="muted">—</span>;
  const t = meta?.type || "";

  if (Array.isArray(value) && t === "many2one") return <span>{String(value[1])}</span>;

  if (t === "selection" && meta?.selection) {
    const found = meta.selection.find((s) => s[0] === value);
    const label = found ? found[1] : String(value);
    if (/state|status/.test(field)) {
      const key = String(value).toLowerCase();
      const c = STATE_COLORS[key] || { bg: "#f1f5f9", fg: "#475569" };
      return (
        <span className="cbadge" style={{ background: c.bg, color: c.fg }}>
          {label}
        </span>
      );
    }
    return <span>{label}</span>;
  }

  if (t === "boolean") return value ? <span className="cbool-y">✓</span> : <span className="cbool-n">—</span>;

  if (t === "many2many" || t === "one2many") {
    return <span className="pill2">{Array.isArray(value) ? value.length : 0}</span>;
  }

  if (t === "monetary" || t === "float" || t === "integer") {
    const num = Number(value);
    if (!isNaN(num)) {
      const cls = t === "monetary" ? `cnum ${num < 0 ? "cneg" : "cpos"}` : "cnum";
      const disp = t === "integer" ? String(value) : num.toLocaleString(undefined, { maximumFractionDigits: 2 });
      return <span className={cls}>{disp}</span>;
    }
  }

  if (t === "date" || t === "datetime") return <span className="cdate">{String(value)}</span>;

  return <span>{String(value)}</span>;
}

/** Picks a sensible default set of list columns the same way the reference workspace did. */
export function pickColumns(fieldsMeta: FieldsMeta): string[] {
  const preferred = [
    "name", "display_name", "complete_name", "default_code", "partner_id",
    "date", "date_order", "amount_total", "state", "email", "phone", "list_price", "reference",
  ];
  const skip = ["one2many", "many2many", "binary", "html", "text"];
  const cols: string[] = [];
  for (const f of preferred) {
    if (fieldsMeta[f] && cols.length < 7 && !skip.includes(fieldsMeta[f].type || "")) cols.push(f);
  }
  for (const f of Object.keys(fieldsMeta)) {
    if (cols.length >= 7) break;
    if (cols.includes(f) || f === "id" || f.startsWith("__")) continue;
    if (!skip.includes(fieldsMeta[f].type || "")) cols.push(f);
  }
  if (!cols.includes("id")) cols.unshift("id");
  return cols;
}
