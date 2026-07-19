import { Handle, Position } from "@xyflow/react";
import { InlineNodeEditor } from "./InlineNodeEditor";
import { useForgeStore } from "../store/forgeStore";
import { ForgeNodeIcon } from "./ForgeNodeIcons";
import "./NodeStyles.css";

/**
 * ExternalApiNode - Represents integration with external services
 * Calls third-party APIs, webhooks, or external systems
 */
export function ExternalApiNode({ id, data }: { id: string; data: any }) {
  const selectedNodeId = useForgeStore((state) => state.selectedNodeId);
  const selectNode = useForgeStore((state) => state.selectNode);
  const deleteNode = useForgeStore((state) => state.deleteNode);
  const isSelected = selectedNodeId === id;

  return (
    <div
      className={`sahab-forge-node sahab-forge-node-external ${isSelected ? "selected" : ""}`}
      onClick={() => selectNode(id)}
    >
      <div className="sahab-forge-node-header">
        <span className="sahab-forge-node-icon"><ForgeNodeIcon kind="externalApi" /></span>
        <span className="sahab-forge-node-title">External API</span>
        <button className="sahab-forge-node-delete" onClick={(e) => { e.stopPropagation(); deleteNode(id); }} title="Delete node">×</button>
      </div>
      <div className="sahab-forge-node-body">
        <div className="sahab-forge-node-label">{data.label || "API"}</div>
        {data.endpoint && (
          <div className="sahab-forge-api-endpoint">{data.endpoint}</div>
        )}
        {isSelected && <InlineNodeEditor nodeId={id} nodeType="externalApi" data={data} />}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
