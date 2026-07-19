import type { ReportDef } from "./dashboard.data";

/**
 * The original workflow called an n8n webhook that ran an AI agent over
 * live Odoo data and returned rendered HTML. There is no backend here yet,
 * so this resolves with a placeholder after a short delay so the loading
 * skeleton / error / retry UI can be exercised end to end. Replace the
 * body with:
 *
 *   const res = await fetch(`${report.endpoint}?lang=${lang}`);
 *   const data = await res.json();
 *   return data.html;
 *
 * and nothing else in ReportCard needs to change.
 */
export async function fetchReportHtml(
  report: ReportDef,
  lang: "ar" | "en"
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 500));
  const placeholder =
    lang === "ar"
      ? `لم يتم توصيل ${report.endpoint} بعد ببيانات حقيقية.`
      : `${report.endpoint} is not wired to real data yet.`;
  return `<p style="color:#64748b;font-size:13px">${placeholder}</p>`;
}

export async function fetchCustomReportHtml(
  prompt: string,
  lang: "ar" | "en"
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 500));
  const safePrompt = prompt.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const note =
    lang === "ar"
      ? "لم يتم توصيل نقطة نهاية الذكاء الاصطناعي بعد."
      : "The AI report endpoint is not wired up yet.";
  return `<p style="color:#0f172a;font-size:13px;margin-bottom:8px"><b>${
    lang === "ar" ? "الطلب" : "Prompt"
  }:</b> ${safePrompt}</p><p style="color:#64748b;font-size:13px">${note}</p>`;
}
