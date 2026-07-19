import { useState } from "react";
import type { ArchNode } from "../../core/odoo/types";
import { resolveModifiers } from "../../core/odoo/viewArch";
import { OdooFieldWidget } from "./OdooFieldWidget";
import "./OdooView.css";

interface FieldsMeta {
  [name: string]: { type?: string; string?: string; selection?: [string, string][] };
}

interface OdooFormViewProps {
  arch: ArchNode;
  fieldsMeta: FieldsMeta;
  record: Record<string, unknown>;
}

export function OdooFormView({ arch, fieldsMeta, record }: OdooFormViewProps) {
  return (
    <div className="odoo-form">
      <ArchNodeRenderer node={arch} fieldsMeta={fieldsMeta} record={record} />
    </div>
  );
}

function ArchNodeRenderer({
  node,
  fieldsMeta,
  record,
}: {
  node: ArchNode;
  fieldsMeta: FieldsMeta;
  record: Record<string, unknown>;
}) {
  const modifiers = resolveModifiers(node, record);
  if (modifiers.invisible) return null;

  switch (node.tag) {
    case "form":
    case "sheet":
    case "header":
    case "div":
      return (
        <div className={`odoo-${node.tag}`}>
          {node.children.map((c, i) => (
            <ArchNodeRenderer key={i} node={c} fieldsMeta={fieldsMeta} record={record} />
          ))}
        </div>
      );

    case "group":
      return (
        <div className="odoo-group">
          {node.children.map((c, i) => (
            <ArchNodeRenderer key={i} node={c} fieldsMeta={fieldsMeta} record={record} />
          ))}
        </div>
      );

    case "notebook":
      return <Notebook node={node} fieldsMeta={fieldsMeta} record={record} />;

    case "separator":
      return <h4 className="odoo-separator">{node.attrs.string}</h4>;

    case "label":
      return <div className="odoo-label">{node.attrs.string || node.text}</div>;

    case "button":
      return (
        <button
          type="button"
          className="odoo-btn"
          disabled={modifiers.readonly}
          title={node.attrs.name}
        >
          {node.attrs.string || node.attrs.name}
        </button>
      );

    case "field": {
      const name = node.attrs.name;
      const meta = fieldsMeta[name];
      return (
        <div className="odoo-field-row">
          <label className="odoo-field-label">
            {meta?.string || name}
            {modifiers.required && <span className="odoo-req"> *</span>}
          </label>
          <OdooFieldWidget value={record[name]} meta={meta} />
        </div>
      );
    }

    default:
      // Unknown/unstyled tags: still render children so nothing gets lost.
      return (
        <>
          {node.children.map((c, i) => (
            <ArchNodeRenderer key={i} node={c} fieldsMeta={fieldsMeta} record={record} />
          ))}
        </>
      );
  }
}

function Notebook({
  node,
  fieldsMeta,
  record,
}: {
  node: ArchNode;
  fieldsMeta: FieldsMeta;
  record: Record<string, unknown>;
}) {
  const pages = node.children.filter((c) => c.tag === "page");
  const [active, setActive] = useState(0);
  if (pages.length === 0) return null;
  return (
    <div className="odoo-notebook">
      <div className="odoo-tabs">
        {pages.map((p, i) => (
          <button
            key={i}
            type="button"
            className={`odoo-tab${i === active ? " active" : ""}`}
            onClick={() => setActive(i)}
          >
            {p.attrs.string}
          </button>
        ))}
      </div>
      <div className="odoo-tab-body">
        {pages[active].children.map((c, i) => (
          <ArchNodeRenderer key={i} node={c} fieldsMeta={fieldsMeta} record={record} />
        ))}
      </div>
    </div>
  );
}
