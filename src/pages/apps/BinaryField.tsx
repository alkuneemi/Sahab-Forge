import { useRef } from "react";
import { useI18n } from "../../core/i18n/I18nContext";
import "./BinaryField.css";

export function BinaryField({
  value,
  readOnly,
  onChange,
}: {
  value: unknown; // base64 string, or false/null when empty
  readOnly: boolean;
  onChange: (base64: string | false) => void;
}) {
  const { lang } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFile = typeof value === "string" && value.length > 0;

  function pick(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      onChange(base64);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="bin-box">
      {hasFile ? (
        <div className="bin-file">
          <a
            className="bin-link"
            href={`data:application/octet-stream;base64,${value}`}
            download="file"
          >
            {lang === "ar" ? "تنزيل الملف" : "Download file"}
          </a>
          {!readOnly && (
            <button type="button" className="bin-remove" onClick={() => onChange(false)}>
              ✕
            </button>
          )}
        </div>
      ) : (
        <span className="bin-empty">{lang === "ar" ? "لا يوجد ملف" : "No file"}</span>
      )}
      {!readOnly && (
        <>
          <input
            ref={inputRef}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pick(f);
              e.target.value = "";
            }}
          />
          <button type="button" className="bin-upload" onClick={() => inputRef.current?.click()}>
            {lang === "ar" ? "رفع ملف" : "Upload"}
          </button>
        </>
      )}
    </div>
  );
}
