import { Handle, Position } from "@xyflow/react";
import { InlineNodeEditor } from "./InlineNodeEditor";
import { useForgeStore } from "../store/forgeStore";
import { ForgeNodeIcon } from "./ForgeNodeIcons";
import "./NodeStyles.css";

/**
 * ModelNode - Represents an Odoo data model/table
 * Connects to views and actions that operate on the model
 */
export function ModelNode({ id, data }: { id: string; data: any }) {
  const fields = data.fields || [];
  const selectedNodeId = useForgeStore((state) => state.selectedNodeId);
  const selectNode = useForgeStore((state) => state.selectNode);
  const deleteNode = useForgeStore((state) => state.deleteNode);
  const isSelected = selectedNodeId === id;

  return (
    <div
      className={`sahab-forge-node sahab-forge-node-model ${isSelected ? "selected" : ""}`}
      onClick={() => selectNode(id)}
    >
      <div className="sahab-forge-node-header">
        <span className="sahab-forge-node-icon"><ForgeNodeIcon kind="model" /></span>
        <span className="sahab-forge-node-title">{data.label || "Model"}</span>
        <button className="sahab-forge-node-delete" onClick={(e) => { e.stopPropagation(); deleteNode(id); }} title="Delete node">×</button>
      </div>
      <div className="sahab-forge-node-body">
        <div className="sahab-forge-model-fields">
          {fields.slice(0, 3).map((field: string) => (
            <div key={field} className="sahab-forge-field-item">
              • {field}
            </div>
          ))}
          {fields.length > 3 && (
            <div className="sahab-forge-field-more">
              +{fields.length - 3} more
            </div>
          )}
        </div>
        {isSelected && <InlineNodeEditor nodeId={id} nodeType="model" data={data} />}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
