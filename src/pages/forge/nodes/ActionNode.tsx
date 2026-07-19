import { Handle, Position } from "@xyflow/react";
import { InlineNodeEditor } from "./InlineNodeEditor";
import { useForgeStore } from "../store/forgeStore";
import { ForgeNodeIcon } from "./ForgeNodeIcons";
import "./NodeStyles.css";

/**
 * ActionNode - Represents a business action or automation
 * Triggers workflows, validations, or data transformations
 */
export function ActionNode({ id, data }: { id: string; data: any }) {
  const selectedNodeId = useForgeStore((state) => state.selectedNodeId);
  const selectNode = useForgeStore((state) => state.selectNode);
  const deleteNode = useForgeStore((state) => state.deleteNode);
  const isSelected = selectedNodeId === id;

  return (
    <div
      className={`sahab-forge-node sahab-forge-node-action ${isSelected ? "selected" : ""}`}
      onClick={() => selectNode(id)}
    >
      <div className="sahab-forge-node-header">
        <span className="sahab-forge-node-icon"><ForgeNodeIcon kind="action" /></span>
        <span className="sahab-forge-node-title">Action</span>
        <button className="sahab-forge-node-delete" onClick={(e) => { e.stopPropagation(); deleteNode(id); }} title="Delete node">×</button>
      </div>
      <div className="sahab-forge-node-body">
        <div className="sahab-forge-node-label">{data.label || "Action"}</div>
        {data.actionType && (
          <div className="sahab-forge-action-type">
            Type: {data.actionType}
          </div>
        )}
        {isSelected && <InlineNodeEditor nodeId={id} nodeType="action" data={data} />}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
