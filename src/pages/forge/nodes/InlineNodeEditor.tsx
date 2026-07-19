import { useState } from "react";
import { useForgeStore } from "../store/forgeStore";

interface InlineNodeEditorProps {
  nodeId: string;
  nodeType: string;
  data: Record<string, unknown>;
}

export function InlineNodeEditor({ nodeId, nodeType, data }: InlineNodeEditorProps) {
  const updateNode = useForgeStore((state) => state.updateNode);
  const [label, setLabel] = useState(String((data.label as string) || ""));
  const [description, setDescription] = useState(String((data.description as string) || ""));
  const [fieldsInput, setFieldsInput] = useState(
    ((data.fields as string[] | undefined) || []).join(", ")
  );
  const [viewType, setViewType] = useState(String((data.viewType as string) || "list"));
  const [actionType, setActionType] = useState(String((data.actionType as string) || ""));
  const [endpoint, setEndpoint] = useState(String((data.endpoint as string) || ""));
  const [statesInput, setStatesInput] = useState(
    ((data.states as string[] | undefined) || []).join(", ")
  );

  const handleApply = () => {
    const payload: Record<string, unknown> = {
      label,
      description,
    };

    if (nodeType === "model") {
      payload.fields = fieldsInput
        .split(",")
        .map((field) => field.trim())
        .filter(Boolean);
    }

    if (nodeType === "view") {
      payload.viewType = viewType;
    }

    if (nodeType === "action") {
      payload.actionType = actionType;
    }

    if (nodeType === "externalApi") {
      payload.endpoint = endpoint;
    }

    if (nodeType === "state") {
      payload.states = statesInput
        .split(",")
        .map((state) => state.trim())
        .filter(Boolean);
    }

    updateNode(nodeId, payload);
  };

  return (
    <div className="sahab-forge-inline-editor">
      <label className="sahab-forge-inline-label">Label</label>
      <input value={label} onChange={(e) => setLabel(e.target.value)} />

      <label className="sahab-forge-inline-label">Description</label>
      <input value={description} onChange={(e) => setDescription(e.target.value)} />

      {nodeType === "model" && (
        <>
          <label className="sahab-forge-inline-label">Fields</label>
          <input value={fieldsInput} onChange={(e) => setFieldsInput(e.target.value)} />
        </>
      )}

      {nodeType === "view" && (
        <>
          <label className="sahab-forge-inline-label">View Type</label>
          <select value={viewType} onChange={(e) => setViewType(e.target.value)}>
            <option value="form">Form</option>
            <option value="list">List</option>
            <option value="kanban">Kanban</option>
            <option value="calendar">Calendar</option>
            <option value="graph">Graph</option>
          </select>
        </>
      )}

      {nodeType === "action" && (
        <>
          <label className="sahab-forge-inline-label">Action Type</label>
          <input value={actionType} onChange={(e) => setActionType(e.target.value)} />
        </>
      )}

      {nodeType === "externalApi" && (
        <>
          <label className="sahab-forge-inline-label">Endpoint</label>
          <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
        </>
      )}

      {nodeType === "state" && (
        <>
          <label className="sahab-forge-inline-label">States</label>
          <input value={statesInput} onChange={(e) => setStatesInput(e.target.value)} />
        </>
      )}

      <button type="button" className="sahab-forge-inline-btn" onClick={handleApply}>
        Apply
      </button>
    </div>
  );
}
