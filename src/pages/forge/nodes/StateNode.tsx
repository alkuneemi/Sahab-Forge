import { Handle, Position } from "@xyflow/react";
import { InlineNodeEditor } from "./InlineNodeEditor";
import { useForgeStore } from "../store/forgeStore";
import { ForgeNodeIcon } from "./ForgeNodeIcons";
import "./NodeStyles.css";

/**
 * StateNode - Represents a state in a workflow
 * Used for status tracking and conditional logic
 */
export function StateNode({ id, data }: { id: string; data: any }) {
  const states = data.states || [];
  const selectedNodeId = useForgeStore((state) => state.selectedNodeId);
  const selectNode = useForgeStore((state) => state.selectNode);
  const deleteNode = useForgeStore((state) => state.deleteNode);
  const isSelected = selectedNodeId === id;

  return (
    <div
      className={`sahab-forge-node sahab-forge-node-state ${isSelected ? "selected" : ""}`}
      onClick={() => selectNode(id)}
    >
      <div className="sahab-forge-node-header">
        <span className="sahab-forge-node-icon"><ForgeNodeIcon kind="state" /></span>
        <span className="sahab-forge-node-title">State</span>
        <button className="sahab-forge-node-delete" onClick={(e) => { e.stopPropagation(); deleteNode(id); }} title="Delete node">×</button>
      </div>
      <div className="sahab-forge-node-body">
        <div className="sahab-forge-node-label">{data.label || "Workflow"}</div>
        <div className="sahab-forge-state-list">
          {states.slice(0, 3).map((state: string) => (
            <div key={state} className="sahab-forge-state-item">
              ◆ {state}
            </div>
          ))}
          {states.length > 3 && (
            <div className="sahab-forge-state-more">
              +{states.length - 3}
            </div>
          )}
        </div>
        {isSelected && <InlineNodeEditor nodeId={id} nodeType="state" data={data} />}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
