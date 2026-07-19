import type { AiAnalystConfig } from "./types";

export interface AnalystPayload {
  model: string;
  label: string;
  app: string;
  lang: "ar" | "en";
  records: Record<string, unknown>[];
}

/** Same field-trimming the original "Build Analyze Prompt" code node did. */
function trimRecords(records: Record<string, unknown>[]) {
  return records.slice(0, 50).map((r) => {
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(r)) {
      if (k === "__last_update" || k.startsWith("__")) continue;
      let v = r[k];
      if (v === false || v === null || v === undefined) continue;
      if (Array.isArray(v)) v = v.length === 2 && typeof v[1] === "string" ? v[1] : v.length;
      if (typeof v === "string" && v.length > 120) v = v.slice(0, 120);
      o[k] = v;
    }
    return o;
  });
}

/**
 * POSTs to the AI endpoint configured in System Control. Expected to return
 * `{ html: string }` (an HTML fragment with <h3>/<ul>/<span class="risk|warn|opp">),
 * exactly like the original "List Analyst AI" langchain agent. If no
 * endpoint is configured yet, resolves with a placeholder instead of
 * throwing, so the panel always renders something useful.
 */
export async function fetchListAnalysis(
  ai: AiAnalystConfig,
  payload: AnalystPayload
): Promise<string> {
  if (!ai.endpoint) {
    return payload.lang === "ar"
      ? `<p style="color:#64748b;font-size:13px">لم يتم ضبط نقطة نهاية محلل السجلات في صفحة الإعدادات بعد.</p>`
      : `<p style="color:#64748b;font-size:13px">The records-analyst endpoint isn't configured in Settings yet.</p>`;
  }
  const res = await fetch(ai.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ai.apiKey ? { Authorization: `Bearer ${ai.apiKey}` } : {}),
    },
    body: JSON.stringify({
      purpose: "list_analysis",
      model: payload.model,
      label: payload.label,
      app: payload.app,
      lang: payload.lang,
      count: Math.min(payload.records.length, 50),
      payload: JSON.stringify(trimRecords(payload.records)),
    }),
  });
  if (!res.ok) throw new Error(`analyst_http_${res.status}`);
  const data = await res.json().catch(() => null);
  const html = data?.html ?? data?.output ?? data?.text;
  if (typeof html !== "string") throw new Error("analyst_bad_response");
  return html;
}

export interface FormBuilderField {
  name: string;
  label: string;
  type: string;
}

/**
 * Same endpoint as fetchListAnalysis (System Control only asks for one AI
 * URL) but with purpose:"form_builder" in the payload, so a single n8n
 * workflow (or any router) can dispatch to a different agent/prompt
 * per-purpose without needing a second Settings field. Expects back
 * `{ html }` — a raw HTML fragment for the requested custom form.
 */
export async function fetchFormBuilderHtml(
  ai: AiAnalystConfig,
  opts: {
    message: string;
    model: string;
    label: string;
    lang: "ar" | "en";
    recordId: number | null;
    sessionId: string;
    fields: FormBuilderField[];
  }
): Promise<string> {
  if (!ai.endpoint) {
    throw new Error(
      opts.lang === "ar" ? "لم يتم ضبط نقطة نهاية الذكاء الاصطناعي في الإعدادات بعد." : "The AI endpoint isn't configured in Settings yet."
    );
  }
  const res = await fetch(ai.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ai.apiKey ? { Authorization: `Bearer ${ai.apiKey}` } : {}),
    },
    body: JSON.stringify({
      purpose: "form_builder",
      message: opts.message,
      model: opts.model,
      label: opts.label,
      lang: opts.lang,
      recordId: opts.recordId,
      sessionId: opts.sessionId,
      fields: JSON.stringify(opts.fields),
    }),
  });
  if (!res.ok) throw new Error(`form_builder_http_${res.status}`);
  const data = await res.json().catch(() => null);
  const html = data?.html ?? data?.output;
  if (typeof html !== "string" || !html.trim()) throw new Error("form_builder_bad_response");
  return stripCodeFence(html);
}

function stripCodeFence(s: string): string {
  const trimmed = s.trim();
  const fence = "```";
  if (trimmed.startsWith(fence)) {
    return trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "").trim();
  }
  return trimmed;
}
