import { Handle, Position } from "@xyflow/react";
import { InlineNodeEditor } from "./InlineNodeEditor";
import { useForgeStore } from "../store/forgeStore";
import { ForgeNodeIcon } from "./ForgeNodeIcons";
import "./NodeStyles.css";

/**
 * ViewNode - Represents a UI view (form, list, kanban, etc.)
 * Displays data from a model in a specific layout
 */
export function ViewNode({ id, data }: { id: string; data: any }) {
  const viewType = data.viewType || "list";
  const selectedNodeId = useForgeStore((state) => state.selectedNodeId);
  const selectNode = useForgeStore((state) => state.selectNode);
  const deleteNode = useForgeStore((state) => state.deleteNode);
  const isSelected = selectedNodeId === id;
  const iconVariant = viewType as "form" | "list" | "kanban" | "calendar" | "graph";

  return (
    <div
      className={`sahab-forge-node sahab-forge-node-view ${isSelected ? "selected" : ""}`}
      onClick={() => selectNode(id)}
    >
      <div className="sahab-forge-node-header">
        <span className="sahab-forge-node-icon"><ForgeNodeIcon kind="view" variant={iconVariant} /></span>
        <span className="sahab-forge-node-title">{viewType.toUpperCase()}</span>
        <button className="sahab-forge-node-delete" onClick={(e) => { e.stopPropagation(); deleteNode(id); }} title="Delete node">×</button>
      </div>
      <div className="sahab-forge-node-body">
        <div className="sahab-forge-node-label">{data.label || "View"}</div>
        <div className="sahab-forge-view-type">Type: {viewType}</div>
        {isSelected && <InlineNodeEditor nodeId={id} nodeType="view" data={data} />}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
