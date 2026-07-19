import React, { useMemo, useState } from "react";
import { useForgeStore } from "../store/forgeStore";
import { ForgeNodeIcon } from "../nodes/ForgeNodeIcons";
import "../AppForge.css";

interface NodeType {
  id: string;
  type: string;
  label: string;
  icon: "start" | "model" | "view" | "action" | "state" | "externalApi";
  description: string;
  color: string;
}

const nodeTypes: NodeType[] = [
  {
    id: "start",
    type: "start",
    label: "Start Node",
    icon: "start",
    description: "App entry point",
    color: "#4caf50",
  },
  {
    id: "model",
    type: "model",
    label: "Model Node",
    icon: "model",
    description: "Data model & fields",
    color: "#2196f3",
  },
  {
    id: "view",
    type: "view",
    label: "View Node",
    icon: "view",
    description: "Form/List/Modal view",
    color: "#ff9800",
  },
  {
    id: "action",
    type: "action",
    label: "Action Node",
    icon: "action",
    description: "Actions & functions",
    color: "#9c27b0",
  },
  {
    id: "state",
    type: "state",
    label: "State Node",
    icon: "state",
    description: "Flow & state manager",
    color: "#f44336",
  },
  {
    id: "externalApi",
    type: "externalApi",
    label: "External API",
    icon: "externalApi",
    description: "External API connector",
    color: "#00bcd4",
  },
];

/**
 * NodePicker - Component to add nodes to the canvas
 * Displays buttons for each node type with visual feedback
 */
export function NodePicker() {
  const { currentAppId, addNode } = useForgeStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  if (!currentAppId) {
    return null;
  }

  const filteredNodes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return nodeTypes;
    return nodeTypes.filter((nodeType) =>
      [nodeType.label, nodeType.description, nodeType.type]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [query]);

  const handleAddNode = (nodeType: string) => {
    const randomX = 150 + Math.random() * 100;
    const randomY = 150 + Math.random() * 100;
    addNode(nodeType, { x: randomX, y: randomY });
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="sahab-forge-node-picker-float">
      <button
        type="button"
        className="sahab-forge-node-picker-toggle"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sahab-forge-node-picker-toggle-icon"><ForgeNodeIcon kind="tool" /></span>
        <span>Add Node</span>
      </button>

      {open && (
        <div className="sahab-forge-node-picker-panel">
          <div className="sahab-forge-node-picker-search">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search nodes"
              aria-label="Search nodes"
            />
          </div>
          <div className="sahab-forge-node-picker-grid">
            {filteredNodes.map((nodeType) => (
              <button
                key={nodeType.id}
                className="sahab-forge-node-picker-btn"
                onClick={() => handleAddNode(nodeType.type)}
                title={nodeType.description}
                style={{
                  "--node-color": nodeType.color,
                } as React.CSSProperties}
              >
                <span className="sahab-forge-node-picker-icon">
                  <ForgeNodeIcon kind={nodeType.icon} variant={nodeType.type === "view" ? "form" : undefined} />
                </span>
                <span className="sahab-forge-node-picker-label">{nodeType.label}</span>
                <span className="sahab-forge-node-picker-desc">{nodeType.description}</span>
              </button>
            ))}
            {filteredNodes.length === 0 && (
              <div className="sahab-forge-node-picker-empty">No nodes match your search.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
