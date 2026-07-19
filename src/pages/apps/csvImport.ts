/** Parses one CSV line, handling quoted fields (including escaped "" quotes). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

export interface FieldMetaLike {
  type?: string;
}

/** Parses a full CSV file into row objects keyed by header, coercing values by field type. */
export function parseCsvFile(text: string, fieldsMeta: Record<string, FieldMetaLike>): Record<string, unknown>[] {
  const clean = text.replace(/^\ufeff/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const obj: Record<string, unknown> = {};
    headers.forEach((h, j) => {
      if (!h || h === "id" || !fieldsMeta[h]) return;
      const raw = cells[j];
      if (raw === undefined || raw === "") return;
      const type = fieldsMeta[h].type;
      let v: unknown = raw;
      if (type === "integer" || type === "many2one") v = parseInt(raw, 10) || raw;
      else if (type === "float" || type === "monetary") v = parseFloat(raw) || raw;
      else if (type === "boolean") v = raw === "true" || raw === "1" || raw === "✓";
      obj[h] = v;
    });
    if (Object.keys(obj).length) rows.push(obj);
  }
  return rows;
}
