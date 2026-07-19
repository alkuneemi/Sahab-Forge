import { useEffect, useRef, useState } from "react";
import { useOdoo } from "../../core/odoo/OdooConnectionContext";
import "./RelationFields.css";

type M2OValue = [number, string] | false | null | undefined;

function useSearch(relation: string | undefined, query: string) {
  const { client } = useOdoo();
  const [results, setResults] = useState<[number, string][]>([]);
  useEffect(() => {
    if (!client || !relation || query.trim().length === 0) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      client
        .nameSearch(relation, query.trim())
        .then((rows) => !cancelled && setResults(rows || []))
        .catch(() => !cancelled && setResults([]));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [client, relation, query]);
  return results;
}

export function Many2OneField({
  relation,
  value,
  readOnly,
  onChange,
  onOpenRelated,
}: {
  relation?: string;
  value: M2OValue;
  readOnly: boolean;
  onChange: (v: [number, string] | false) => void;
  onOpenRelated?: (relation: string, id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = useSearch(relation, query);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const display = Array.isArray(value) ? value[1] : "";

  return (
    <div className="m2o-box" ref={boxRef}>
      <div className="m2o-row">
        <input
          disabled={readOnly}
          value={open ? query : display}
          placeholder={relation ? `${relation}…` : ""}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => setQuery(e.target.value)}
        />
        {Array.isArray(value) && !readOnly && (
          <button type="button" className="m2o-clear" onClick={() => onChange(false)} title="Clear">
            ✕
          </button>
        )}
        {Array.isArray(value) && onOpenRelated && relation && (
          <button
            type="button"
            className="m2o-open"
            title="Open"
            onClick={() => onOpenRelated(relation, value[0])}
          >
            ↗
          </button>
        )}
      </div>
      {open && !readOnly && (
        <div className="m2o-drop">
          {results.length === 0 && <div className="m2o-empty">{query ? "…" : "اكتب للبحث"}</div>}
          {results.map((r) => (
            <button
              key={r[0]}
              type="button"
              className="m2o-item"
              onClick={() => {
                onChange(r);
                setOpen(false);
              }}
            >
              {r[1]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Many2ManyField({
  relation,
  value,
  readOnly,
  onChange,
}: {
  relation?: string;
  value: unknown; // array of ids, or array of [id, name] tuples when freshly picked
  readOnly: boolean;
  onChange: (ids: number[]) => void;
}) {
  const { client } = useOdoo();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<Record<number, string>>({});
  const results = useSearch(relation, query);
  const boxRef = useRef<HTMLDivElement>(null);

  const ids: number[] = Array.isArray(value) ? value.map((v) => (Array.isArray(v) ? v[0] : v)).filter((v): v is number => typeof v === "number") : [];

  useEffect(() => {
    if (!client || !relation || ids.length === 0) return;
    const missing = ids.filter((id) => !(id in labels));
    if (!missing.length) return;
    client
      .read(relation, missing, ["display_name"])
      .then((rows: { id: number; display_name: string }[]) => {
        setLabels((prev) => {
          const next = { ...prev };
          rows.forEach((r) => (next[r.id] = r.display_name));
          return next;
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, relation, ids.join(",")]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  function addId(id: number, label: string) {
    if (!ids.includes(id)) onChange([...ids, id]);
    setLabels((prev) => ({ ...prev, [id]: label }));
    setQuery("");
  }
  function removeId(id: number) {
    onChange(ids.filter((x) => x !== id));
  }

  return (
    <div className="m2m-box" ref={boxRef}>
      <div className="m2m-tags">
        {ids.map((id) => (
          <span className="m2m-tag" key={id}>
            {labels[id] || `#${id}`}
            {!readOnly && (
              <b onClick={() => removeId(id)}>×</b>
            )}
          </span>
        ))}
        {!readOnly && (
          <input
            className="m2m-input"
            value={query}
            placeholder={relation ? `${relation}…` : ""}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
          />
        )}
      </div>
      {open && !readOnly && (
        <div className="m2o-drop">
          {results.filter((r) => !ids.includes(r[0])).length === 0 && <div className="m2o-empty">{query ? "…" : "اكتب للبحث"}</div>}
          {results
            .filter((r) => !ids.includes(r[0]))
            .map((r) => (
              <button key={r[0]} type="button" className="m2o-item" onClick={() => addId(r[0], r[1])}>
                {r[1]}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
