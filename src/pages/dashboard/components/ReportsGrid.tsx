import { useState } from "react";
import { useI18n } from "../../../core/i18n/I18nContext";
import { reportDefs } from "../dashboard.data";
import { ReportCard } from "./ReportCard";
import { CustomReportModal } from "./CustomReportModal";
import "./ReportsGrid.css";

export function ReportsGrid() {
  const { t } = useI18n();
  const [modalPrompt, setModalPrompt] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  function requestCustomReport() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setModalPrompt(trimmed);
  }

  return (
    <div className="reports-panel">
      <div className="crx">
        <div className="crx-t">{t("reports_h")}</div>
        <div className="crx-in">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && requestCustomReport()}
            placeholder={t("custom_ph")}
          />
          <button type="button" onClick={requestCustomReport}>
            {t("custom_btn")}
          </button>
        </div>
      </div>

      <div className="rep-grid">
        {reportDefs.map((report) => (
          <ReportCard key={report.key} report={report} />
        ))}
      </div>

      {modalPrompt !== null && (
        <CustomReportModal
          prompt={modalPrompt}
          onClose={() => setModalPrompt(null)}
        />
      )}
    </div>
  );
}
