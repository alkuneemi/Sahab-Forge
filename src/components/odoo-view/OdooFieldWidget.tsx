interface FieldMeta {
  type?: string;
  string?: string;
  selection?: [string, string][];
}

function formatValue(value: unknown, meta?: FieldMeta): string {
  if (value === false || value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    // many2one -> [id, "Display Name"]
    if (value.length === 2 && typeof value[1] === "string") return value[1];
    // many2many/one2many -> list of ids
    return `${value.length} record(s)`;
  }
  if (meta?.type === "selection" && meta.selection) {
    const found = meta.selection.find((pair) => pair[0] === value);
    if (found) return found[1];
  }
  if (typeof value === "boolean") return value ? "✓" : "✗";
  return String(value);
}

export function OdooFieldWidget({
  value,
  meta,
}: {
  value: unknown;
  meta?: FieldMeta;
}) {
  if (meta?.type === "boolean") {
    return <input type="checkbox" checked={Boolean(value)} readOnly />;
  }
  return <span className="odoo-field-value">{formatValue(value, meta)}</span>;
}
