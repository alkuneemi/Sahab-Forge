import { useEffect, useState } from "react";
import { useI18n } from "../../core/i18n/I18nContext";
import { useOdoo } from "../../core/odoo/OdooConnectionContext";
import { fetchListAnalysis } from "../../core/odoo/aiAnalyst";
import "./AiAnalysisPanel.css";

interface AiAnalysisPanelProps {
  model: string;
  label: string;
  appTech: string;
  records: Record<string, unknown>[];
}

export function AiAnalysisPanel({ model, label, appTech, records }: AiAnalysisPanelProps) {
  const { t, lang } = useI18n();
  const { aiConfig } = useOdoo();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  function load() {
    setHtml(null);
    setError(false);
    fetchListAnalysis(aiConfig, { model, label, app: appTech, lang, records })
      .then(setHtml)
      .catch(() => setError(true));
  }

  useEffect(load, [model, records.length, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ai-panel">
      <div className="ai-panel-head">
        <span>{t("reports_h")}</span>
        <button type="button" onClick={load} title={t("rep_refresh")}>
          &#8635;
        </button>
      </div>
      <div className="ai-panel-body">
        {error && (
          <div className="rep-err">
            {t("rep_err")}{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); load(); }}>{t("rep_retry")}</a>
          </div>
        )}
        {!error && html === null && (
          <div className="rep-skel">
            <div className="rep-spin" />
            <div>{t("rep_loading")}</div>
          </div>
        )}
        {!error && html !== null && <div dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </div>
  );
}
