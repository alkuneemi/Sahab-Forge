import { useEffect, useState } from "react";
import { useI18n } from "../../../core/i18n/I18nContext";
import { fetchCustomReportHtml } from "../reports.api";
import "./CustomReportModal.css";

interface CustomReportModalProps {
  prompt: string;
  onClose: () => void;
}

export function CustomReportModal({ prompt, onClose }: CustomReportModalProps) {
  const { t, lang } = useI18n();
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCustomReportHtml(prompt, lang).then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => {
      cancelled = true;
    };
  }, [prompt, lang]);

  return (
    <div
      className="rep-modal show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rep-modal-card">
        <div className="rep-modal-head">
          <b>{t("custom_report_h")}</b>
          <div className="rep-modal-actions">
            <button
              id="repPrint"
              type="button"
              onClick={() => window.print()}
            >
              {t("rep_print")}
            </button>
            <button id="repClose" type="button" onClick={onClose}>
              {t("rep_close")}
            </button>
          </div>
        </div>
        <div className="rep-modal-body">
          {html === null ? (
            <div className="rep-skel">
              <div className="rep-spin" />
              <div>{t("rep_loading")}</div>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </div>
    </div>
  );
}
