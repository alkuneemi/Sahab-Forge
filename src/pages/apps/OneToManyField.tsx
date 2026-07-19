import { useEffect, useState } from "react";
import type { ArchNode } from "../../core/odoo/types";
import { parseArch } from "../../core/odoo/viewArch";
import { useOdoo } from "../../core/odoo/OdooConnectionContext";
import { useI18n } from "../../core/i18n/I18nContext";
import { formatCell, pickColumns, type FieldsMeta } from "./fieldFormat";
import { RecordFormModal } from "./RecordFormModal";
import "./OneToManyField.css";

interface Row {
  key: string;
  op: "create" | "update" | "unchanged" | "delete";
  id?: number;
  data: Record<string, unknown>;
}

let keySeq = 0;
function newKey() {
  return `row_${++keySeq}`;
}

function isTruthyAttr(v: string | undefined): boolean {
  return v === "1" || v === "true" || v === "True";
}

export function OneToManyField({
  relation,
  fieldNode,
  value,
  readOnly,
  onChange,
}: {
  relation?: string;
  fieldNode: ArchNode;
  value: unknown;
  readOnly: boolean;
  onChange: (commands: unknown[]) => void;
}) {
  const { client } = useOdoo();
  const { lang } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [fieldsMeta, setFieldsMeta] = useState<FieldsMeta>({});
  const [listArch, setListArch] = useState<ArchNode | null>(
    fieldNode.children.find((c) => c.tag === "list" || c.tag === "tree") || null
  );
  const [formArch, setFormArch] = useState<ArchNode | null>(
    fieldNode.children.find((c) => c.tag === "form") || null
  );
  const [editing, setEditing] = useState<{ row: Row | null } | null>(null); // null = closed, {row:null} = new

  // Load metadata for the related model once.
  useEffect(() => {
    if (!client || !relation) return;
    client.fieldsGet(relation).then(setFieldsMeta).catch(() => {});
  }, [client, relation]);

  // Populate initial rows from the ids Odoo gave us for an existing parent record.
  useEffect(() => {
    if (!client || !relation) return;
    const ids = Array.isArray(value) ? value.filter((v): v is number => typeof v === "number") : [];
    if (!ids.length) return;
    const cols = listArch ? listArch.children.filter((c) => c.tag === "field").map((c) => c.attrs.name) : undefined;
    client
      .read(relation, ids, cols)
      .then((recs: Record<string, unknown>[]) => {
        setRows(recs.map((r) => ({ key: newKey(), op: "unchanged", id: r.id as number, data: r })));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, relation]);

  function commit(next: Row[]) {
    setRows(next);
    const commands = next
      .filter((r) => r.op !== "unchanged")
      .map((r) => {
        if (r.op === "create") return [0, 0, r.data];
        if (r.op === "update") return [1, r.id, r.data];
        if (r.op === "delete" && r.id) return [2, r.id, 0];
        return null;
      })
      .filter(Boolean);
    onChange(commands);
  }

  async function ensureFormArch() {
    if (formArch || !client || !relation) return formArch;
    const view = await client.getView(relation, "form");
    const parsed = parseArch(view.arch);
    setFormArch(parsed);
    return parsed;
  }
  async function ensureListArch() {
    if (listArch || !client || !relation) return listArch;
    const view = await client.getView(relation, "tree");
    const parsed = parseArch(view.arch);
    setListArch(parsed);
    return parsed;
  }

  const columns = listArch
    ? listArch.children
        .filter((c) => c.tag === "field" && !isTruthyAttr(c.attrs.column_invisible) && !isTruthyAttr(c.attrs.invisible))
        .map((c) => c.attrs.name)
    : pickColumns(fieldsMeta);
  const visibleRows = rows.filter((r) => r.op !== "delete");

  async function openNew() {
    await Promise.all([ensureFormArch(), ensureListArch()]);
    setEditing({ row: null });
  }
  async function openEdit(row: Row) {
    await ensureFormArch();
    setEditing({ row });
  }

  function handleSavedLocal(values: Record<string, unknown>) {
    if (!editing) return;
    if (editing.row) {
      const updated: Row = {
        ...editing.row,
        data: { ...editing.row.data, ...values },
        op: editing.row.op === "create" ? "create" : "update",
      };
      commit(rows.map((r) => (r.key === editing.row!.key ? updated : r)));
    } else {
      commit([...rows, { key: newKey(), op: "create", data: values }]);
    }
    setEditing(null);
  }

  function removeRow(row: Row) {
    if (row.op === "create") {
      commit(rows.filter((r) => r.key !== row.key));
    } else {
      commit(rows.map((r) => (r.key === row.key ? { ...r, op: "delete" } : r)));
    }
  }

  return (
    <div className="o2m-box">
      <div className="o2m-tablewrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{fieldsMeta[c]?.string || c}</th>
              ))}
              {!readOnly && <th className="o2m-actcol" />}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="o2m-empty">
                  {lang === "ar" ? "لا توجد سطور بعد." : "No lines yet."}
                </td>
              </tr>
            )}
            {visibleRows.map((row) => (
              <tr key={row.key} onClick={() => !readOnly && openEdit(row)} className={readOnly ? "" : "clickable"}>
                {columns.map((c) => (
                  <td key={c}>{formatCell(row.data[c], c, fieldsMeta[c])}</td>
                ))}
                {!readOnly && (
                  <td className="o2m-actcol" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="o2m-del" onClick={() => removeRow(row)}>
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <button type="button" className="o2m-add" onClick={openNew}>
          + {lang === "ar" ? "إضافة سطر" : "Add a line"}
        </button>
      )}

      {editing && formArch && relation && (
        <RecordFormModal
          model={relation}
          label={fieldsMeta.display_name?.string || relation}
          arch={formArch}
          fieldsMeta={fieldsMeta}
          record={editing.row?.data || {}}
          recordId={editing.row?.id ?? null}
          mode="local"
          onSaveLocal={handleSavedLocal}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}
    </div>
  );
}
