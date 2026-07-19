import { useEffect, useState } from "react";
import { useI18n } from "../../core/i18n/I18nContext";
import { useOdoo } from "../../core/odoo/OdooConnectionContext";
import "./ChatterPanel.css";

interface ChatMessage {
  id: number;
  author_id: [number, string] | false;
  body: string;
  date: string;
  message_type: string;
  subject?: string;
}

function stripHtml(html: string) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  return (tmp.textContent || tmp.innerText || "").trim();
}

export function ChatterPanel({ model, recordId }: { model: string; recordId: number | null }) {
  const { t, lang } = useI18n();
  const { client } = useOdoo();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [error, setError] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  function load() {
    if (!client || !recordId) return;
    setMessages(null);
    setError(false);
    client
      .getMessages(model, recordId)
      .then((rows: ChatMessage[]) => setMessages(rows || []))
      .catch(() => setError(true));
  }

  useEffect(load, [client, model, recordId]); // eslint-disable-line react-hooks/exhaustive-deps

  function send() {
    const body = text.trim();
    if (!body || !recordId || !client) return;
    setSending(true);
    client
      .messagePost(model, recordId, body)
      .then(() => {
        setText("");
        load();
      })
      .finally(() => setSending(false));
  }

  return (
    <div className="chatter">
      <div className="ch-head">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>{lang === "ar" ? "الرسائل والإشعارات" : "Messages and Notifications"}</span>
      </div>
      <div className="ch-msgs">
        {!recordId && (
          <div className="ch-empty">{lang === "ar" ? "افتح سجلاً لعرض المحادثات والإشعارات." : "Open a record to view its chatter."}</div>
        )}
        {recordId && messages === null && !error && (
          <div className="ch-empty">{t("rep_loading")}</div>
        )}
        {recordId && error && <div className="ch-err">{lang === "ar" ? "تعذّر تحميل الرسائل." : "Could not load messages."}</div>}
        {recordId && messages && messages.length === 0 && (
          <div className="ch-empty">{lang === "ar" ? "لا توجد رسائل على هذا السجل." : "No messages on this record."}</div>
        )}
        {recordId &&
          messages?.map((m) => (
            <div className="ch-msg" key={m.id}>
              <div className="ch-m-h">
                <span className="ch-au">{Array.isArray(m.author_id) ? m.author_id[1] : t("user_fallback")}</span>
                <span>{m.date}</span>
                <span className="ch-rn">{m.message_type === "notification" ? "🔔" : "💬"} #{recordId}</span>
              </div>
              <div className="ch-bd">{stripHtml(m.body) || m.subject || ""}</div>
            </div>
          ))}
      </div>
      <div className="ch-in">
        <input
          value={text}
          disabled={!recordId || sending}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={lang === "ar" ? "اكتب رسالة…" : "Write a message..."}
        />
        <button type="button" disabled={!recordId || sending} onClick={send}>
          ➤
        </button>
      </div>
    </div>
  );
}
