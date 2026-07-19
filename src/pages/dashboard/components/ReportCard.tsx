import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../../../core/i18n/I18nContext";
import type { ReportDef } from "../dashboard.data";
import { fetchReportHtml } from "../reports.api";
import "./ReportCard.css";

type Status = "loading" | "ready" | "error";

export function ReportCard({ report }: { report: ReportDef }) {
  const { t, lang } = useI18n();
  const [status, setStatus] = useState<Status>("loading");
  const [html, setHtml] = useState("");

  const load = useCallback(() => {
    setStatus("loading");
    fetchReportHtml(report, lang)
      .then((result) => {
        setHtml(result);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [report, lang]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rep-frame">
      <div className="rep-head">
        <span className="rep-title">{t(report.titleKey)}</span>
        <button
          className="rep-ref"
          type="button"
          title={t("rep_refresh")}
          onClick={load}
        >
          &#8635;
        </button>
      </div>
      <div className="rep-body">
        {status === "loading" && (
          <div className="rep-skel">
            <div className="rep-spin" />
            <div>{t("rep_loading")}</div>
          </div>
        )}
        {status === "error" && (
          <div className="rep-err">
            {t("rep_err")}{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                load();
              }}
            >
              {t("rep_retry")}
            </a>
          </div>
        )}
        {status === "ready" && (
          <div dangerouslySetInnerHTML={{ __html: html || `<div class="rep-err">${t("rep_empty")}</div>` }} />
        )}
      </div>
    </div>
  );
}
