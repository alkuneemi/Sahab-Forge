import { useMemo, useRef, useState } from "react";
import { useI18n } from "../../core/i18n/I18nContext";
import { useOdoo } from "../../core/odoo/OdooConnectionContext";
import { fetchFormBuilderHtml } from "../../core/odoo/aiAnalyst";
import { saveCustomForm, type CustomForm } from "./customForms";
import type { FieldsMeta } from "./fieldFormat";
import "./FormBuilderPanel.css";

interface ChatMsg {
  who: "u" | "a";
  text: string;
}

export function FormBuilderPanel({
  model,
  label,
  recordId,
  fieldsMeta,
  onSaved,
}: {
  model: string;
  label: string;
  recordId: number | null;
  fieldsMeta: FieldsMeta;
  onSaved: (form: CustomForm) => void;
}) {
  const { lang } = useI18n();
  const { aiConfig } = useOdoo();
  const sessionId = useMemo(() => `fb_${model}_${recordId || "new"}_${Date.now()}`, [model, recordId]);

  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [html, setHtml] = useState("");
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("★");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const fieldList = useMemo(
    () => Object.keys(fieldsMeta).map((k) => ({ name: k, label: fieldsMeta[k].string || k, type: fieldsMeta[k].type || "" })),
    [fieldsMeta]
  );
  const slashMatches = useMemo(() => {
    const q = slashQuery.toLowerCase();
    return fieldList.filter((f) => !q || f.name.toLowerCase().includes(q) || f.label.toLowerCase().includes(q)).slice(0, 40);
  }, [fieldList, slashQuery]);

  function handleInputChange(v: string) {
    setInput(v);
    const el = taRef.current;
    const pos = el ? el.selectionStart : v.length;
    const upto = v.slice(0, pos);
    const m = /[/\\]([\w.]*)$/.exec(upto);
    if (m) {
      setSlashQuery(m[1] || "");
      setSlashOpen(true);
      setSlashIndex(0);
    } else {
      setSlashOpen(false);
    }
  }

  function pickSlash(fieldName: string) {
    const el = taRef.current;
    const pos = el ? el.selectionStart : input.length;
    const upto = input.slice(0, pos);
    const rest = input.slice(pos);
    const next = upto.replace(/[/\\][\w.]*$/, `@${fieldName} `) + rest;
    setInput(next);
    setSlashOpen(false);
    requestAnimationFrame(() => el?.focus());
  }

  function send() {
    const text = input.trim();
    if (!text || busy) return;
    setMsgs((m) => [...m, { who: "u", text }]);
    setInput("");
    setBusy(true);
    const waitIdx = msgs.length + 1;
    setMsgs((m) => [...m, { who: "a", text: lang === "ar" ? "جارٍ التصميم…" : "Designing…" }]);
    fetchFormBuilderHtml(aiConfig, {
      message: text,
      model,
      label,
      lang,
      recordId,
      sessionId,
      fields: fieldList,
    })
      .then((resultHtml) => {
        setHtml(resultHtml);
        setMsgs((m) => m.map((msg, i) => (i === waitIdx ? { ...msg, text: lang === "ar" ? "تم تحديث المعاينة ✓" : "Preview updated ✓" } : msg)));
      })
      .catch((e: Error) => {
        setMsgs((m) => m.map((msg, i) => (i === waitIdx ? { ...msg, text: e.message } : msg)));
      })
      .finally(() => setBusy(false));
  }

  function doSave() {
    if (!name.trim() || !html) return;
    const form = saveCustomForm({ model, name: name.trim(), icon: icon || "★", html });
    onSaved(form);
  }

  const frameDoc = useMemo(() => buildFrameDoc(html, lang), [html, lang]);

  return (
    <div className="fb-wrap">
      <div className="fb-left">
        <div className="fb-msgs">
          {msgs.length === 0 && (
            <div className="fb-hint">
              {lang === "ar"
                ? "صِف الاستمارة التي تريدها وسيبنيها الذكاء الاصطناعي. اكتب / لإدراج حقل من هذا النموذج."
                : "Describe the form you want and the AI will build it. Type / to insert a field from this model."}
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`fb-msg ${m.who}`}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="fb-inbar">
          {slashOpen && (
            <div className="fb-slash">
              {slashMatches.length === 0 && <div className="fb-slash-empty">…</div>}
              {slashMatches.map((f, i) => (
                <div
                  key={f.name}
                  className={`fb-slash-it${i === slashIndex ? " hl" : ""}`}
                  onClick={() => pickSlash(f.name)}
                >
                  <span>
                    <b>{f.label}</b> <span className="fb-slash-name">{f.name}</span>
                  </span>
                  <span className="fb-slash-ty">{f.type}</span>
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={taRef}
            value={input}
            placeholder={lang === "ar" ? "مثال: أنشئ استمارة أنيقة تعرض /partner_id و /amount_total…" : "e.g. Build a sleek form showing /partner_id and /amount_total…"}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (slashOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                e.preventDefault();
                setSlashIndex((i) => {
                  const len = slashMatches.length || 1;
                  return e.key === "ArrowDown" ? (i + 1) % len : (i - 1 + len) % len;
                });
                return;
              }
              if (slashOpen && (e.key === "Enter" || e.key === "Tab")) {
                e.preventDefault();
                const f = slashMatches[slashIndex];
                if (f) pickSlash(f.name);
                return;
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button type="button" disabled={busy} onClick={send}>
            ➤
          </button>
        </div>
      </div>
      <div className="fb-right">
        <div className="fb-prev-head">
          <span className="fb-prev-title">{lang === "ar" ? "معاينة الاستمارة المخصصة" : "Custom form preview"}</span>
          {html && (
            <div className="fb-savebar">
              <input className="fb-icon" maxLength={2} value={icon} onChange={(e) => setIcon(e.target.value)} />
              <input placeholder={lang === "ar" ? "اسم الاستمارة" : "Form name"} value={name} onChange={(e) => setName(e.target.value)} />
              <button type="button" className="fb-save-btn" onClick={doSave}>
                {lang === "ar" ? "حفظ" : "Save"}
              </button>
            </div>
          )}
        </div>
        <div className="fb-prev-body">
          {!html && (
            <div className="fb-prev-empty">
              {lang === "ar" ? "ستظهر معاينة الاستمارة هنا بعد أن يبنيها الذكاء الاصطناعي." : "The form preview will appear here once the AI builds it."}
            </div>
          )}
          {html && <iframe title="form-preview" srcDoc={frameDoc} />}
        </div>
      </div>
    </div>
  );
}

function buildFrameDoc(bodyHtml: string, lang: "ar" | "en") {
  const rtl = lang === "ar";
  return `<!DOCTYPE html><html dir="${rtl ? "rtl" : "ltr"}" lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box;font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif}body{margin:0;padding:16px;background:#fff;color:#0f172a}</style></head><body>${bodyHtml}</body></html>`;
}
