import { useEffect, useMemo, useState } from "react";
import type { ArchNode } from "../../core/odoo/types";
import { resolveModifiers, parseArch } from "../../core/odoo/viewArch";
import { useOdoo } from "../../core/odoo/OdooConnectionContext";
import { useI18n } from "../../core/i18n/I18nContext";
import type { FieldsMeta } from "./fieldFormat";
import { Many2OneField, Many2ManyField } from "./RelationFields";
import { OneToManyField } from "./OneToManyField";
import { BinaryField } from "./BinaryField";
import { FormBuilderPanel } from "./FormBuilderPanel";
import { listCustomForms, type CustomForm } from "./customForms";
import "./RecordFormModal.css";

interface RecordFormModalProps {
  model: string;
  label: string;
  arch: ArchNode;
  fieldsMeta: FieldsMeta;
  record: Record<string, unknown>; // {} for a new record
  recordId: number | null;
  onClose: () => void;
  onSaved: () => void;
  /** "local" is used for rows edited inside a one2many table: nothing is
   *  sent to Odoo here, the values are just handed back to the parent form
   *  to include in ITS own write/create. Defaults to "server". */
  mode?: "server" | "local";
  onSaveLocal?: (values: Record<string, unknown>) => void;
}

type Draft = Record<string, unknown>;

export function RecordFormModal({
  model,
  label,
  arch,
  fieldsMeta,
  record,
  recordId,
  onClose,
  onSaved,
  mode = "server",
  onSaveLocal,
}: RecordFormModalProps) {
  const { client } = useOdoo();
  const { lang } = useI18n();
  const [draft, setDraft] = useState<Draft>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openRelated, setOpenRelated] = useState<{ relation: string; id: number } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [customForms, setCustomForms] = useState<CustomForm[]>(() => (mode === "server" ? listCustomForms(model) : []));

  const header = useMemo(() => arch.children.find((c) => c.tag === "header"), [arch]);
  const bodyNodes = useMemo(
    () => arch.children.filter((c) => c.tag !== "header" && c.tag !== "chatter"),
    [arch]
  );

  function fieldValue(name: string) {
    return name in draft ? draft[name] : record[name];
  }
  function setField(name: string, value: unknown) {
    setDraft((d) => ({ ...d, [name]: value }));
  }

  function runButton(node: ArchNode) {
    if (!recordId) {
      setError(lang === "ar" ? "احفظ السجل أولاً" : "Save the record first");
      return;
    }
    const btype = node.attrs.type || "object";
    const name = node.attrs.name;
    if (!client || !name) return;
    if (btype !== "object") {
      setError(lang === "ar" ? "نوع إجراء غير مدعوم هنا" : "Unsupported action type here");
      return;
    }
    const confirmMsg = node.attrs.confirm;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    client
      .callMethod(model, name, [[recordId]], {})
      .then(() => onSaved())
      .catch((e: Error) => setError(e.message));
  }

  function save() {
    if (mode === "local") {
      onSaveLocal?.(draft);
      return;
    }
    if (!client) return;
    setSaving(true);
    setError(null);
    const p = recordId ? client.write(model, [recordId], draft) : client.create(model, draft);
    p.then(() => onSaved())
      .catch((e: Error) => setError(e.message))
      .finally(() => setSaving(false));
  }

  const title = (record.display_name as string) || (recordId ? `${label} #${recordId}` : `${label} — ${lang === "ar" ? "جديد" : "New"}`);

  return (
    <div className="rf-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rf-card">
        <div className="rf-head">
          <b>{title}</b>
          {mode === "server" && (
            <div className="rf-tabs-top">
              <button type="button" className={`rf-tab-top${activeTab === "basic" ? " active" : ""}`} onClick={() => setActiveTab("basic")}>
                {lang === "ar" ? "عرض أساسي" : "Standard view"}
              </button>
              <button type="button" className={`rf-tab-top tpl${activeTab === "builder" ? " active" : ""}`} onClick={() => setActiveTab("builder")}>
                {lang === "ar" ? "منشئ الاستمارات" : "Form builder"}
              </button>
              {customForms.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`rf-tab-top custom${activeTab === f.id ? " active" : ""}`}
                  title={f.name}
                  onClick={() => setActiveTab(f.id)}
                >
                  {f.icon} {f.name}
                </button>
              ))}
            </div>
          )}
          <button type="button" onClick={onClose}>✕</button>
        </div>
        <div className="rf-body">
          {activeTab === "basic" && (
            <>
              {header && (
                <RfHeader node={header} record={record} draft={draft} fieldsMeta={fieldsMeta} onButton={runButton} />
              )}
              {error && (
                <div className="rf-err">
                  <b>{lang === "ar" ? "تعذّر الحفظ" : "Could not save"}</b>
                  <div>{error}</div>
                </div>
              )}
              {bodyNodes.map((n, i) => (
                <RfArchNode
                  key={i}
                  node={n}
                  fieldsMeta={fieldsMeta}
                  record={record}
                  getValue={fieldValue}
                  setValue={setField}
                  onOpenRelated={(relation, id) => setOpenRelated({ relation, id })}
                />
              ))}
            </>
          )}

          {activeTab === "builder" && (
            <FormBuilderPanel
              model={model}
              label={label}
              recordId={recordId}
              fieldsMeta={fieldsMeta}
              onSaved={(form) => {
                setCustomForms((prev) => [...prev, form]);
                setActiveTab(form.id);
              }}
            />
          )}

          {activeTab !== "basic" && activeTab !== "builder" && (
            <CustomFormView form={customForms.find((f) => f.id === activeTab) || null} lang={lang} />
          )}
        </div>
        {activeTab === "basic" && (
          <div className="rf-foot">
            <button type="button" className="rf-btn" onClick={onClose}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <button type="button" className="rf-btn prim" disabled={saving} onClick={save}>
              {saving ? "…" : lang === "ar" ? "حفظ" : "Save"}
            </button>
          </div>
        )}
      </div>

      {openRelated && (
        <RelatedRecordLoader
          relation={openRelated.relation}
          id={openRelated.id}
          onClose={() => setOpenRelated(null)}
        />
      )}
    </div>
  );
}

/** Renders a saved custom (AI-built) form inside an isolated iframe. */
function CustomFormView({ form, lang }: { form: CustomForm | null; lang: "ar" | "en" }) {
  if (!form) return null;
  const doc = `<!DOCTYPE html><html dir="${lang === "ar" ? "rtl" : "ltr"}" lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box;font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif}body{margin:0;padding:16px;background:#fff;color:#0f172a}</style></head><body>${form.html}</body></html>`;
  return <iframe title={form.name} className="rf-custom-frame" srcDoc={doc} />;
}

/** Fetches the view + record for a many2one's "open" link, then shows it in another RecordFormModal (server mode — it's a real, separately-saved record). */
function RelatedRecordLoader({ relation, id, onClose }: { relation: string; id: number; onClose: () => void }) {
  const { client } = useOdoo();
  const [data, setData] = useState<{ arch: ArchNode; fieldsMeta: FieldsMeta; record: Record<string, unknown> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    Promise.all([client.getView(relation, "form"), client.fieldsGet(relation)])
      .then(([view, fg]) =>
        client.read(relation, [id]).then((rows: Record<string, unknown>[]) => {
          if (cancelled) return;
          setData({ arch: parseArch(view.arch), fieldsMeta: fg, record: rows[0] || {} });
        })
      )
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [client, relation, id]);

  if (error) {
    return (
      <div className="rf-modal" onClick={onClose}>
        <div className="rf-card" style={{ maxWidth: 420 }}>
          <div className="rf-body">
            <div className="rf-err">{error}</div>
          </div>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <RecordFormModal
      model={relation}
      label={relation}
      arch={data.arch}
      fieldsMeta={data.fieldsMeta}
      record={data.record}
      recordId={id}
      onClose={onClose}
      onSaved={onClose}
    />
  );
}

/** Expands <t>...</t> wrapper elements in place so "direct child" scans (buttons, statusbar field) still find what's nested inside them. */
function flattenT(nodes: ArchNode[]): ArchNode[] {
  const out: ArchNode[] = [];
  for (const n of nodes) {
    if (n.tag === "t") out.push(...flattenT(n.children));
    else out.push(n);
  }
  return out;
}

function RfHeader({
  node,
  record,
  draft,
  fieldsMeta,
  onButton,
}: {
  node: ArchNode;
  record: Record<string, unknown>;
  draft: Draft;
  fieldsMeta: FieldsMeta;
  onButton: (n: ArchNode) => void;
}) {
  const flat = flattenT(node.children);
  const buttons = flat.filter((c) => c.tag === "button");
  const statusField = flat.find((c) => c.tag === "field" && c.attrs.widget === "statusbar");
  const merged = { ...record, ...draft };

  return (
    <div className="rf-header">
      <div className="rf-header-btns">
        {buttons.map((b, i) => {
          const modifiers = resolveModifiers(b, merged);
          if (modifiers.invisible) return null;
          const isPrimary = /btn-primary|oe_highlight/.test(b.attrs.class || "");
          return (
            <button
              key={i}
              type="button"
              className={`rf-btn${isPrimary ? " prim" : ""}`}
              onClick={() => onButton(b)}
            >
              {b.attrs.string || b.attrs.name}
            </button>
          );
        })}
      </div>
      {statusField && <RfStatusbar name={statusField.attrs.name} meta={fieldsMeta[statusField.attrs.name]} value={merged[statusField.attrs.name]} />}
    </div>
  );
}

function RfStatusbar({ name, meta, value }: { name: string; meta?: FieldsMeta[string]; value: unknown }) {
  if (!meta) return null;
  if (meta.type === "selection" && meta.selection) {
    const curIdx = meta.selection.findIndex((s) => s[0] === value);
    return (
      <div className="rf-statusbar">
        {meta.selection.map((s, i) => (
          <span key={s[0]} className={`rf-stage${s[0] === value ? " cur" : i < curIdx ? " done" : ""}`}>
            {s[1]}
          </span>
        ))}
      </div>
    );
  }
  if (meta.type === "many2one") {
    const label = Array.isArray(value) ? value[1] : "—";
    return (
      <div className="rf-statusbar">
        <span className="rf-stage cur">{String(label)}</span>
      </div>
    );
  }
  return null;
}

function RfArchNode({
  node,
  fieldsMeta,
  record,
  getValue,
  setValue,
  onOpenRelated,
}: {
  node: ArchNode;
  fieldsMeta: FieldsMeta;
  record: Record<string, unknown>;
  getValue: (name: string) => unknown;
  setValue: (name: string, value: unknown) => void;
  onOpenRelated: (relation: string, id: number) => void;
}) {
  const modifiers = resolveModifiers(node, record);
  if (modifiers.invisible) return null;

  switch (node.tag) {
    case "form":
    case "sheet":
    case "div":
      return (
        <div className="rf-arch">
          {node.children.map((c, i) => (
            <RfArchNode key={i} node={c} fieldsMeta={fieldsMeta} record={record} getValue={getValue} setValue={setValue} onOpenRelated={onOpenRelated} />
          ))}
        </div>
      );
    case "group":
      return (
        <div className="rf-group">
          {node.children.map((c, i) => (
            <RfArchNode key={i} node={c} fieldsMeta={fieldsMeta} record={record} getValue={getValue} setValue={setValue} onOpenRelated={onOpenRelated} />
          ))}
        </div>
      );
    case "notebook":
      return <RfNotebook node={node} fieldsMeta={fieldsMeta} record={record} getValue={getValue} setValue={setValue} onOpenRelated={onOpenRelated} />;
    case "separator":
      return <div className="rf-sep">{node.attrs.string}</div>;
    case "label": {
      const forField = node.attrs.for;
      const text = node.attrs.string || (forField ? fieldsMeta[forField]?.string : "") || node.text || "";
      return text ? <div className="rf-label">{text}</div> : null;
    }
    case "field": {
      const name = node.attrs.name;
      const meta = fieldsMeta[name];
      if (!meta) return null;
      const fieldMods = resolveModifiers(node, record);
      const isWide = ["text", "one2many", "binary"].includes(meta.type || "");
      return (
        <div className={`rf-field${isWide ? " full" : ""}`}>
          <label>
            {meta.string || name}
            {(meta.required || fieldMods.required) && <span className="rf-req"> *</span>}
          </label>
          <RfControl
            node={node}
            meta={meta}
            value={getValue(name)}
            readOnly={!!fieldMods.readonly}
            onChange={(v) => setValue(name, v)}
            onOpenRelated={onOpenRelated}
          />
        </div>
      );
    }
    default:
      return (
        <>
          {node.children.map((c, i) => (
            <RfArchNode key={i} node={c} fieldsMeta={fieldsMeta} record={record} getValue={getValue} setValue={setValue} onOpenRelated={onOpenRelated} />
          ))}
        </>
      );
  }
}

function RfNotebook({
  node,
  fieldsMeta,
  record,
  getValue,
  setValue,
  onOpenRelated,
}: {
  node: ArchNode;
  fieldsMeta: FieldsMeta;
  record: Record<string, unknown>;
  getValue: (name: string) => unknown;
  setValue: (name: string, value: unknown) => void;
  onOpenRelated: (relation: string, id: number) => void;
}) {
  const pages = node.children.filter((c) => c.tag === "page");
  const [active, setActive] = useState(0);
  if (!pages.length) return null;
  return (
    <div className="rf-notebook">
      <div className="rf-tabs">
        {pages.map((p, i) => (
          <button key={i} type="button" className={`rf-tab${i === active ? " active" : ""}`} onClick={() => setActive(i)}>
            {p.attrs.string}
          </button>
        ))}
      </div>
      <div className="rf-tab-body">
        {pages[active].children.map((c, i) => (
          <RfArchNode key={i} node={c} fieldsMeta={fieldsMeta} record={record} getValue={getValue} setValue={setValue} onOpenRelated={onOpenRelated} />
        ))}
      </div>
    </div>
  );
}

function RfControl({
  node,
  meta,
  value,
  readOnly,
  onChange,
  onOpenRelated,
}: {
  node: ArchNode;
  meta: FieldsMeta[string];
  value: unknown;
  readOnly: boolean;
  onChange: (v: unknown) => void;
  onOpenRelated: (relation: string, id: number) => void;
}) {
  if (meta.type === "many2one") {
    return (
      <Many2OneField
        relation={meta.relation}
        value={value as [number, string] | false}
        readOnly={readOnly}
        onChange={onChange}
        onOpenRelated={onOpenRelated}
      />
    );
  }
  if (meta.type === "many2many") {
    return <Many2ManyField relation={meta.relation} value={value} readOnly={readOnly} onChange={onChange} />;
  }
  if (meta.type === "one2many") {
    return <OneToManyField relation={meta.relation} fieldNode={node} value={value} readOnly={readOnly} onChange={onChange} />;
  }
  if (meta.type === "binary") {
    return <BinaryField value={value} readOnly={readOnly} onChange={onChange} />;
  }
  if (meta.type === "selection" && meta.selection) {
    return (
      <select disabled={readOnly} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="" />
        {meta.selection.map((s) => (
          <option key={s[0]} value={s[0]}>
            {s[1]}
          </option>
        ))}
      </select>
    );
  }
  if (meta.type === "boolean") {
    return (
      <select disabled={readOnly} value={value ? "true" : "false"} onChange={(e) => onChange(e.target.value === "true")}>
        <option value="false">—</option>
        <option value="true">✓</option>
      </select>
    );
  }
  if (meta.type === "text") {
    return (
      <textarea
        rows={3}
        disabled={readOnly}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  const inputType = ["integer", "float", "monetary"].includes(meta.type || "")
    ? "number"
    : meta.type === "date"
    ? "date"
    : "text";
  return (
    <input
      type={inputType}
      disabled={readOnly}
      value={(value as string | number) ?? ""}
      onChange={(e) => onChange(inputType === "number" ? Number(e.target.value) : e.target.value)}
    />
  );
}
