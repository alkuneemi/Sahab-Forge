import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { SkyShell } from "../../core/layout/SkyShell";
import { useI18n } from "../../core/i18n/I18nContext";
import { useOdoo } from "../../core/odoo/OdooConnectionContext";
import { parseArch } from "../../core/odoo/viewArch";
import type { ArchNode } from "../../core/odoo/types";
import type { MenuNode } from "../../core/odoo/OdooClient";
import { formatCell, pickColumns, type FieldsMeta } from "./fieldFormat";
import { parseCsvFile } from "./csvImport";
import { AppMenuBar } from "./AppMenuBar";
import { AiAnalysisPanel } from "./AiAnalysisPanel";
import { ChatterPanel } from "./ChatterPanel";
import { RecordFormModal } from "./RecordFormModal";
import "./AppWorkspacePage.css";

interface Filter {
  field: string;
  op: string;
  val: unknown;
}

export default function AppWorkspacePage() {
  const { tech = "" } = useParams();
  const { t, lang } = useI18n();
  const { client, apps } = useOdoo();
  const app = apps.find((a) => a.tech === tech);

  const [tree, setTree] = useState<MenuNode[] | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState("");

  const [fieldsMeta, setFieldsMeta] = useState<FieldsMeta>({});
  const [columns, setColumns] = useState<string[]>([]);
  const [formArch, setFormArch] = useState<ArchNode | null>(null);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<number, true>>({});
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [filterModal, setFilterModal] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openRecord, setOpenRecord] = useState<{ id: number | null; record: Record<string, unknown> } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load the app's real Odoo menu tree, auto-select the first leaf menu.
  useEffect(() => {
    if (!client || !app) return;
    let cancelled = false;
    setTree(null);
    client
      .getAppMenuTree(app.name)
      .then((t) => {
        if (cancelled) return;
        setTree(t);
        const first = firstLeaf(t);
        if (first) {
          setActiveModel(first.model);
          setActiveLabel(first.name);
        }
      })
      .catch((err) => !cancelled && setLoadError(err.message));
    return () => {
      cancelled = true;
    };
  }, [client, app]);

  // Load view + records whenever the active model changes.
  useEffect(() => {
    if (!client || !activeModel) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSelectedIds({});
    Promise.all([client.fieldsGet(activeModel), client.getView(activeModel, "form")])
      .then(([fg, form]) => {
        if (cancelled) return;
        setFieldsMeta(fg);
        setColumns(pickColumns(fg));
        setFormArch(parseArch(form.arch));
        return runSearch(activeModel, fg, [], []);
      })
      .catch((err) => !cancelled && setLoadError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, activeModel]);

  function runSearch(model: string, fg: FieldsMeta, activeFilters: Filter[], searchDomain: unknown[]) {
    if (!client) return;
    const domain: unknown[] = [...searchDomain, ...activeFilters.map((f) => [f.field, f.op, f.val])];
    return client.searchRead(model, domain, { limit: 100 }).then((rows: Record<string, unknown>[]) => setRecords(rows || []));
  }

  useEffect(() => {
    if (!client || !activeModel) return;
    const nameField = fieldsMeta.name ? "name" : fieldsMeta.display_name ? "display_name" : null;
    const searchDomain = search.trim() && nameField ? [[nameField, "ilike", search.trim()]] : [];
    const handle = setTimeout(() => {
      runSearch(activeModel, fieldsMeta, filters, searchDomain);
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters]);

  function handleMenuSelect(node: MenuNode) {
    if (!node.model) return;
    setActiveModel(node.model);
    setActiveLabel(node.name);
    setSearch("");
    setFilters([]);
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }
  function toggleSelectAll(checked: boolean) {
    if (!checked) return setSelectedIds({});
    const next: Record<number, true> = {};
    records.forEach((r) => (next[r.id as number] = true));
    setSelectedIds(next);
  }

  function deleteSelected() {
    if (!client || !activeModel) return;
    const ids = Object.keys(selectedIds).map(Number);
    if (!ids.length) return;
    if (!confirm(lang === "ar" ? "حذف السجلات المحددة؟" : "Delete selected records?")) return;
    client.unlink(activeModel, ids).then(() => runSearch(activeModel, fieldsMeta, filters, []));
  }

  function exportCsv() {
    if (!records.length) return;
    const lines = [columns.join(",")];
    records.forEach((r) => {
      lines.push(
        columns
          .map((c) => {
            let v = r[c];
            if (Array.isArray(v)) v = v[1] ?? v[0];
            if (v == null || v === false) v = "";
            return `"${String(v).replace(/"/g, '""')}"`;
          })
          .join(",")
      );
    });
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${activeModel}.csv`;
    a.click();
  }

  function importCsv(file: File) {
    if (!client || !activeModel) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsvFile(String(reader.result || ""), fieldsMeta);
      if (!rows.length) {
        setImportStatus(lang === "ar" ? "لم يتم العثور على سطور صالحة في الملف." : "No valid rows found in the file.");
        return;
      }
      setImporting(true);
      setImportStatus(lang === "ar" ? `جارٍ الاستيراد… 0 / ${rows.length}` : `Importing… 0 / ${rows.length}`);
      let done = 0;
      let failed = 0;
      const next = (i: number): void => {
        if (i >= rows.length) {
          setImporting(false);
          setImportStatus(
            lang === "ar" ? `اكتمل الاستيراد: ${done} نجاح، ${failed} فشل.` : `Import finished: ${done} ok, ${failed} failed.`
          );
          runSearch(activeModel, fieldsMeta, filters, []);
          return;
        }
        client
          .create(activeModel, rows[i])
          .then(() => {
            done++;
          })
          .catch(() => {
            failed++;
          })
          .finally(() => {
            setImportStatus(lang === "ar" ? `جارٍ الاستيراد… ${i + 1} / ${rows.length}` : `Importing… ${i + 1} / ${rows.length}`);
            next(i + 1);
          });
      };
      next(0);
    };
    reader.readAsText(file);
  }

  const filterableFields = useMemo(
    () =>
      Object.keys(fieldsMeta).filter((f) =>
        ["char", "text", "selection", "integer", "float", "boolean", "date", "datetime", "many2one"].includes(fieldsMeta[f].type || "")
      ),
    [fieldsMeta]
  );

  if (!client) {
    return (
      <SkyShell frameClassName="auth-frame">
        <div className="aw-msg">لا يوجد اتصال بـ Odoo — فعّله من صفحة التحكم بالنظام.</div>
      </SkyShell>
    );
  }
  if (!app) {
    return (
      <SkyShell frameClassName="auth-frame">
        <div className="aw-msg">هذا التطبيق غير مفعّل.</div>
      </SkyShell>
    );
  }

  return (
    <SkyShell frameClassName="dashboard-frame">
      <div className="aw-top">
        <div className="aw-brand">{app.name}</div>
        {tree && tree.length > 0 && (
          <span className="aw-crumb">
            {app.name} / {activeLabel}
          </span>
        )}
        {tree ? (
          <AppMenuBar tree={tree} activeModel={activeModel} activeLabel={activeLabel} onSelect={handleMenuSelect} />
        ) : (
          <span className="mb-empty">{t("rep_loading")}</span>
        )}
      </div>

      <div className="aw-body">
        <div className="aw-area">
          <div className="aw-split-top">
            <div className="aw-list-col">
              <div className="aw-pgh">
                <h2>{activeLabel || "—"}</h2>
              </div>

              {activeModel && (
                <div className="aw-toolbar">
                  <div className="aw-search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === "ar" ? "بحث…" : "Search…"} />
                  </div>
                  <button type="button" className="aw-tbtn" onClick={() => setFilterModal(true)}>
                    {lang === "ar" ? "فلاتر" : "Filters"}
                  </button>
                  <button type="button" className="aw-tbtn" onClick={exportCsv}>
                    {lang === "ar" ? "تصدير" : "Export"}
                  </button>
                  <button type="button" className="aw-tbtn" disabled={importing} onClick={() => fileInputRef.current?.click()}>
                    {lang === "ar" ? "استيراد" : "Import"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) importCsv(f);
                      e.target.value = "";
                    }}
                  />
                  {Object.keys(selectedIds).length > 0 && (
                    <button type="button" className="aw-tbtn danger" onClick={deleteSelected}>
                      {lang === "ar" ? "حذف" : "Delete"} ({Object.keys(selectedIds).length})
                    </button>
                  )}
                  <button type="button" className="aw-tbtn prim" onClick={() => setOpenRecord({ id: null, record: {} })}>
                    {lang === "ar" ? "جديد" : "New"}
                  </button>
                </div>
              )}

              {importStatus && <div className="aw-import-status">{importStatus}</div>}

              {filters.length > 0 && (
                <div className="aw-chips">
                  {filters.map((f, i) => (
                    <span className="aw-chip" key={i}>
                      {fieldsMeta[f.field]?.string || f.field} {f.op} {String(f.val)}
                      <b onClick={() => setFilters(filters.filter((_, idx) => idx !== i))}>×</b>
                    </span>
                  ))}
                </div>
              )}

              <div className="aw-tablewrap">
                {!activeModel && <div className="aw-state">{lang === "ar" ? "اختر قائمة من الأعلى لعرض السجلات." : "Pick a menu above to view records."}</div>}
                {activeModel && loading && <div className="aw-spin">{t("rep_loading")}</div>}
                {activeModel && !loading && loadError && <div className="aw-state" style={{ color: "#b91c1c" }}>{loadError}</div>}
                {activeModel && !loading && !loadError && records.length === 0 && (
                  <div className="aw-state">{lang === "ar" ? "لا توجد سجلات." : "No records."}</div>
                )}
                {activeModel && !loading && !loadError && records.length > 0 && (
                  <table>
                    <thead>
                      <tr>
                        <th className="ckcell">
                          <input
                            type="checkbox"
                            checked={records.length > 0 && Object.keys(selectedIds).length === records.length}
                            onChange={(e) => toggleSelectAll(e.target.checked)}
                          />
                        </th>
                        {columns
                          .filter((c) => c !== "id")
                          .map((c) => (
                            <th key={c}>{fieldsMeta[c]?.string || c}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={String(r.id)} onClick={() => setOpenRecord({ id: r.id as number, record: r })}>
                          <td className="ckcell" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={!!selectedIds[r.id as number]} onChange={() => toggleSelect(r.id as number)} />
                          </td>
                          {columns
                            .filter((c) => c !== "id")
                            .map((c) => (
                              <td key={c}>{formatCell(r[c], c, fieldsMeta[c])}</td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {records.length > 0 && (
                <div className="aw-statbar">
                  {records.length} {lang === "ar" ? "سجل" : "records"}
                </div>
              )}
            </div>

            <div className="aw-ai-col">
              {activeModel ? (
                <AiAnalysisPanel model={activeModel} label={activeLabel} appTech={app.tech} records={records} />
              ) : (
                <div className="aw-ai-empty">{lang === "ar" ? "اختر قائمة لعرض تحليل آخر 50 سجل." : "Pick a menu to analyze the last 50 records."}</div>
              )}
            </div>
          </div>

          <div className="aw-split-bottom">
            {activeModel && <ChatterPanel model={activeModel} recordId={openRecord?.id ?? null} />}
          </div>
        </div>
      </div>

      {filterModal && (
        <FilterModal
          fields={filterableFields}
          fieldsMeta={fieldsMeta}
          onClose={() => setFilterModal(false)}
          onApply={(f) => {
            setFilters((prev) => [...prev, f]);
            setFilterModal(false);
          }}
        />
      )}

      {openRecord && activeModel && formArch && (
        <RecordFormModal
          model={activeModel}
          label={activeLabel}
          arch={formArch}
          fieldsMeta={fieldsMeta}
          record={openRecord.record}
          recordId={openRecord.id}
          onClose={() => setOpenRecord(null)}
          onSaved={() => {
            setOpenRecord(null);
            runSearch(activeModel, fieldsMeta, filters, []);
          }}
        />
      )}
    </SkyShell>
  );
}

function firstLeaf(nodes: MenuNode[]): MenuNode | null {
  for (const n of nodes) {
    if (n.model) return n;
    const child = firstLeaf(n.children);
    if (child) return child;
  }
  return null;
}

function FilterModal({
  fields,
  fieldsMeta,
  onClose,
  onApply,
}: {
  fields: string[];
  fieldsMeta: FieldsMeta;
  onClose: () => void;
  onApply: (f: Filter) => void;
}) {
  const { lang } = useI18n();
  const [field, setField] = useState(fields[0] || "");
  const [op, setOp] = useState("=");
  const [val, setVal] = useState("");

  function apply() {
    if (!field || !val) return;
    const type = fieldsMeta[field]?.type;
    let parsed: unknown = val;
    if (type === "integer" || type === "many2one") parsed = parseInt(val, 10) || val;
    else if (type === "float") parsed = parseFloat(val) || val;
    else if (type === "boolean") parsed = val === "true" || val === "1";
    onApply({ field, op, val: parsed });
  }

  return (
    <div className="aw-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="aw-modal-card">
        <div className="aw-modal-head">
          <h3>{lang === "ar" ? "إضافة فلتر" : "Add filter"}</h3>
          <button type="button" onClick={onClose}>✕</button>
        </div>
        <div className="aw-modal-body">
          <div className="aw-fld">
            <label>{lang === "ar" ? "الحقل" : "Field"}</label>
            <select value={field} onChange={(e) => setField(e.target.value)}>
              {fields.map((f) => (
                <option key={f} value={f}>
                  {fieldsMeta[f]?.string || f} ({f})
                </option>
              ))}
            </select>
          </div>
          <div className="aw-fld">
            <label>{lang === "ar" ? "العامل" : "Operator"}</label>
            <select value={op} onChange={(e) => setOp(e.target.value)}>
              {["=", "!=", "ilike", ">", ">=", "<", "<="].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="aw-fld">
            <label>{lang === "ar" ? "القيمة" : "Value"}</label>
            <input value={val} onChange={(e) => setVal(e.target.value)} />
          </div>
        </div>
        <div className="aw-modal-foot">
          <button type="button" className="aw-tbtn" onClick={onClose}>
            {lang === "ar" ? "إلغاء" : "Cancel"}
          </button>
          <button type="button" className="aw-tbtn prim" onClick={apply}>
            {lang === "ar" ? "تطبيق" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
