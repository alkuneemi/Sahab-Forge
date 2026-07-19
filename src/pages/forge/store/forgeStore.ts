import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { Node, Edge } from "@xyflow/react";

/**
 * @typedef {Object} ForgeAppData
 * @property {string} id - Unique app identifier
 * @property {string} name - Application name
 * @property {string} description - App description
 * @property {Node[]} nodes - React Flow nodes
 * @property {Edge[]} edges - Node connections
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last modification timestamp
 */
export interface ForgeAppData {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

/**
 * @typedef {Object} ForgeStore
 * @property {ForgeAppData[]} apps - List of created apps
 * @property {string | null} currentAppId - Currently active app
 * @property {Function} createApp - Create new app
 * @property {Function} updateApp - Update app data
 * @property {Function} loadApp - Load specific app
 * @property {Function} deleteApp - Delete an app
 * @property {Function} setNodes - Update canvas nodes
 * @property {Function} setEdges - Update canvas edges
 */
interface ForgeStore {
  apps: ForgeAppData[];
  currentAppId: string | null;
  selectedNodeId: string | null;
  createApp: (name: string, description: string) => void;
  updateApp: (id: string, data: Partial<ForgeAppData>) => void;
  loadApp: (id: string) => void;
  deleteApp: (id: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (type: string, position?: { x: number; y: number }) => void;
  selectNode: (id: string | null) => void;
  updateNode: (id: string, data: Record<string, unknown>) => void;
  deleteNode: (id: string) => void;
}

const STORAGE_KEY = "sahab_forge_apps";

/**
 * Initialize Zustand store with localStorage persistence.
 * Manages Forge applications, nodes, edges, and canvas state.
 */
export const useForgeStore = create<ForgeStore>((set, get) => ({
  apps: loadAppsFromStorage(),
  currentAppId: null,
  selectedNodeId: null,

  /**
   * Create a new application with initial empty canvas
   */
  createApp: (name: string, description: string) => {
    const newApp: ForgeAppData = {
      id: uuidv4(),
      name,
      description,
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      apps: [...state.apps, newApp],
      currentAppId: newApp.id,
    }));
    saveAppsToStorage(get().apps);
  },

  /**
   * Update specific app properties
   */
  updateApp: (id: string, data: Partial<ForgeAppData>) => {
    set((state) => ({
      apps: state.apps.map((app) =>
        app.id === id
          ? {
              ...app,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : app
      ),
    }));
    saveAppsToStorage(get().apps);
  },

  /**
   * Load and set current app for editing
   */
  loadApp: (id: string) => {
    set({ currentAppId: id, selectedNodeId: null });
  },

  /**
   * Delete app by ID
   */
  deleteApp: (id: string) => {
    set((state) => ({
      apps: state.apps.filter((app) => app.id !== id),
      currentAppId: state.currentAppId === id ? null : state.currentAppId,
      selectedNodeId: state.currentAppId === id ? null : state.selectedNodeId,
    }));
    saveAppsToStorage(get().apps);
  },

  /**
   * Update canvas nodes for current app
   */
  setNodes: (nodes: Node[]) => {
    const { currentAppId } = get();
    if (currentAppId) {
      get().updateApp(currentAppId, { nodes });
    }
  },

  /**
   * Update canvas edges for current app
   */
  setEdges: (edges: Edge[]) => {
    const { currentAppId } = get();
    if (currentAppId) {
      get().updateApp(currentAppId, { edges });
    }
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  updateNode: (id: string, data: Record<string, unknown>) => {
    const { currentAppId, apps } = get();
    if (!currentAppId) return;

    const currentApp = apps.find((a) => a.id === currentAppId);
    if (!currentApp) return;

    const updatedNodes = currentApp.nodes.map((node) =>
      node.id === id
        ? {
            ...node,
            data: {
              ...(node.data as Record<string, unknown>),
              ...data,
            },
          }
        : node
    );

    get().updateApp(currentAppId, { nodes: updatedNodes });
  },

  deleteNode: (id: string) => {
    const { currentAppId, apps } = get();
    if (!currentAppId) return;

    const currentApp = apps.find((a) => a.id === currentAppId);
    if (!currentApp) return;

    const updatedNodes = currentApp.nodes.filter((node) => node.id !== id);
    const updatedEdges = currentApp.edges.filter(
      (edge) => edge.source !== id && edge.target !== id
    );

    get().updateApp(currentAppId, { nodes: updatedNodes, edges: updatedEdges });
    set({ selectedNodeId: null });
  },

  /**
   * Add a new node to the current app
   */
  addNode: (type: string, position = { x: 100, y: 100 }) => {
    const { currentAppId, apps } = get();
    if (!currentAppId) return;
    
    const currentApp = apps.find((a) => a.id === currentAppId);
    if (!currentApp) return;

    const nodeTypeLabels: Record<string, string> = {
      start: "App Entry",
      model: "New Model",
      view: "New View",
      action: "New Action",
      state: "New State",
      externalApi: "External API",
    };

    const newNode: Node = {
      id: uuidv4(),
      type,
      position,
      data: {
        label: nodeTypeLabels[type] || `${type} Node`,
        fields: type === "model" ? [] : undefined,
        viewType: type === "view" ? "form" : undefined,
      },
    };

    const updatedNodes = [...currentApp.nodes, newNode];
    get().updateApp(currentAppId, { nodes: updatedNodes });
  },
}));

/**
 * Load apps from browser localStorage
 */
function loadAppsFromStorage(): ForgeAppData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Persist apps to browser localStorage
 */
function saveAppsToStorage(apps: ForgeAppData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  } catch {
    /* ignore storage quota errors */
  }
}
