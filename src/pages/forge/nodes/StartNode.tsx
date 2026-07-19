import { Handle, Position } from "@xyflow/react";
import { InlineNodeEditor } from "./InlineNodeEditor";
import { useForgeStore } from "../store/forgeStore";
import { ForgeNodeIcon } from "./ForgeNodeIcons";
import "./NodeStyles.css";

/**
 * StartNode - Entry point for application flow
 * Used to initialize app state and trigger workflows
 */
export function StartNode({ id, data }: { id: string; data: any }) {
  const selectedNodeId = useForgeStore((state) => state.selectedNodeId);
  const selectNode = useForgeStore((state) => state.selectNode);
  const deleteNode = useForgeStore((state) => state.deleteNode);
  const isSelected = selectedNodeId === id;

  return (
    <div
      className={`sahab-forge-node sahab-forge-node-start ${isSelected ? "selected" : ""}`}
      onClick={() => selectNode(id)}
    >
      <div className="sahab-forge-node-header">
        <span className="sahab-forge-node-icon"><ForgeNodeIcon kind="start" /></span>
        <span className="sahab-forge-node-title">Start</span>
        <button className="sahab-forge-node-delete" onClick={(e) => { e.stopPropagation(); deleteNode(id); }} title="Delete node">×</button>
      </div>
      <div className="sahab-forge-node-body">
        <div className="sahab-forge-node-label">{data.label || "App Entry"}</div>
        {isSelected && <InlineNodeEditor nodeId={id} nodeType="start" data={data} />}
      </div>
      <Handle type="source" position={Position.Right} className="sahab-forge-handle" />
    </div>
  );
}
