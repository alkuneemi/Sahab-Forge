import { useEffect, useRef, useState } from "react";
import type { MenuNode } from "../../core/odoo/OdooClient";
import "./AppMenuBar.css";

interface AppMenuBarProps {
  tree: MenuNode[];
  activeModel: string | null;
  activeLabel: string;
  onSelect: (node: MenuNode) => void;
}

export function AppMenuBar({ tree, activeModel, activeLabel, onSelect }: AppMenuBarProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  // The dropdown is position:fixed (see AppMenuBar.css) precisely so that
  // .menubar's own overflow-x:auto (needed for horizontal scrolling on
  // narrow screens) can never clip it — a plain position:absolute dropdown
  // gets cut off by any scrollable ancestor, fixed does not. We compute its
  // on-screen coordinates ourselves from the trigger button, same as the
  // reference implementation's openDrop().
  const [dropPos, setDropPos] = useState<{ top: number; left: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpenId(null);
    }
    function onClose() {
      setOpenId(null);
    }
    document.addEventListener("click", onDocClick);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("click", onDocClick);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, []);

  function openDrop(nodeId: number) {
    const btn = btnRefs.current[nodeId];
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const rtl = document.documentElement.dir === "rtl";
    const dropWidth = 220;
    let left = rtl ? r.right - dropWidth : r.left;
    if (left < 8) left = 8;
    if (left + dropWidth > window.innerWidth - 8) left = window.innerWidth - 8 - dropWidth;
    setDropPos({ top: r.bottom + 4, left });
    setOpenId(nodeId);
  }

  if (!tree.length) return null;

  function renderDropItem(node: MenuNode, depth: number) {
    const pad = 12 + depth * 12;
    const hasKids = node.children.length > 0;
    return (
      <div key={node.id}>
        {node.model && (
          <button
            type="button"
            className={`mb-link${node.model === activeModel && node.name === activeLabel ? " active" : ""}`}
            style={{ paddingInlineStart: pad }}
            onClick={() => {
              onSelect(node);
              setOpenId(null);
            }}
          >
            {node.name}
          </button>
        )}
        {!node.model && hasKids && (
          <div className="mb-grp" style={{ paddingInlineStart: pad }}>
            {node.name}
          </div>
        )}
        {hasKids && node.children.map((c) => renderDropItem(c, depth + 1))}
      </div>
    );
  }

  return (
    <div className="menubar" ref={barRef}>
      {tree.map((node) => {
        const hasKids = node.children.length > 0;
        if (!hasKids && node.model) {
          return (
            <div className="mb-item" key={node.id}>
              <button
                type="button"
                className={`mb-btn${node.model === activeModel && node.name === activeLabel ? " active" : ""}`}
                onClick={() => onSelect(node)}
              >
                {node.name}
              </button>
            </div>
          );
        }
        if (!hasKids) return null;
        const isOpen = openId === node.id;
        return (
          <div className={`mb-item${isOpen ? " open" : ""}`} key={node.id}>
            <button
              type="button"
              ref={(el) => (btnRefs.current[node.id] = el)}
              className="mb-btn"
              onClick={(e) => {
                e.stopPropagation();
                isOpen ? setOpenId(null) : openDrop(node.id);
              }}
            >
              {node.name} <span className="car">▾</span>
            </button>
            {isOpen && dropPos && (
              <div className="mb-drop" style={{ top: dropPos.top, left: dropPos.left }}>
                {node.model && renderDropItem({ ...node, children: [] }, 0)}
                {node.children.map((c) => renderDropItem(c, 0))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
