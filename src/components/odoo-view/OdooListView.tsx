import type { ArchNode } from "../../core/odoo/types";
import { OdooFieldWidget } from "./OdooFieldWidget";
import "./OdooView.css";

interface FieldsMeta {
  [name: string]: { type?: string; string?: string; selection?: [string, string][] };
}

interface OdooListViewProps {
  arch: ArchNode;
  fieldsMeta: FieldsMeta;
  records: Record<string, unknown>[];
  onRowClick?: (record: Record<string, unknown>) => void;
}

export function OdooListView({ arch, fieldsMeta, records, onRowClick }: OdooListViewProps) {
  const columns = arch.children.filter((c) => c.tag === "field");

  return (
    <div className="odoo-list-wrap">
      <table className="odoo-list">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.attrs.name}>
                {fieldsMeta[col.attrs.name]?.string || col.attrs.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((rec) => (
            <tr
              key={String(rec.id)}
              onClick={() => onRowClick?.(rec)}
              className={onRowClick ? "clickable" : undefined}
            >
              {columns.map((col) => (
                <td key={col.attrs.name}>
                  <OdooFieldWidget
                    value={rec[col.attrs.name]}
                    meta={fieldsMeta[col.attrs.name]}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {records.length === 0 && <div className="odoo-list-empty">—</div>}
    </div>
  );
}
