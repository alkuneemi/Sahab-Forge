import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useForgeStore } from "../store/forgeStore";
import { NodePicker } from "../ui/NodePicker";
import { StartNode } from "../nodes/StartNode";
import { ModelNode } from "../nodes/ModelNode";
import { ViewNode } from "../nodes/ViewNode";
import { ActionNode } from "../nodes/ActionNode";
import { StateNode } from "../nodes/StateNode";
import { ExternalApiNode } from "../nodes/ExternalApiNode";

const nodeTypes = {
  start: StartNode,
  model: ModelNode,
  view: ViewNode,
  action: ActionNode,
  state: StateNode,
  externalApi: ExternalApiNode,
};

/**
 * ForgeCanvas - React Flow canvas for visual app builder
 * Displays nodes and edges, handles connections between components
 */
export function ForgeCanvas() {
  const { currentAppId, apps, selectedNodeId, selectNode } = useForgeStore();
  const { setNodes, setEdges } = useForgeStore();

  const currentApp = apps.find((a) => a.id === currentAppId);
  const initialNodes = useMemo(() => currentApp?.nodes || [], [currentApp?.id, currentApp?.nodes]);
  const initialEdges = useMemo(() => currentApp?.edges || [], [currentApp?.id, currentApp?.edges]);
  const [nodes, setNodesLocal, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdgesLocal, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodesLocal(initialNodes);
  }, [initialNodes, setNodesLocal]);

  useEffect(() => {
    setEdgesLocal(initialEdges);
  }, [initialEdges, setEdgesLocal]);

  /**
   * Handle new connections between nodes
   */
  const onConnect = (connection: Connection) => {
    const newEdges = addEdge(connection, edges);
    setEdgesLocal(newEdges);
    setEdges(newEdges);
  };

  const onNodeClick = (_: React.MouseEvent, node: { id: string }) => {
    selectNode(node.id);
  };

  /**
   * Persist node changes
   */
  const handleNodesChange = (changes: NodeChange[]) => {
    onNodesChange(changes);
    const updatedNodes = nodes.map((node) => {
      const change = changes.find((c: any) => c.id === node.id);
      if (change && change.type === "position" && change.position) {
        return { ...node, position: change.position };
      }
      return node;
    }) as typeof nodes;
    setNodes(updatedNodes);
  };

  /**
   * Persist edge changes
   */
  const handleEdgesChange = (changes: EdgeChange[]) => {
    onEdgesChange(changes);
    setEdges(edges);
  };

  if (!currentApp) {
    return (
      <div className="sahab-forge-canvas-empty">
        <p>Create or select an app to start building</p>
      </div>
    );
  }

  return (
    <div className="sahab-forge-canvas-container">
      {/* Node Picker Sidebar */}
      <NodePicker />
      
      {/* React Flow Canvas */}
      <div className="sahab-forge-canvas-main">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={() => selectNode(null)}
          nodeTypes={nodeTypes}
          fitView
          className="sahab-forge-reactflow"
        >
          <Background color="#aaa" gap={16} />
          <Controls className="sahab-forge-controls" />
          <MiniMap className="sahab-forge-minimap" />
        </ReactFlow>
      </div>
    </div>
  );
}
