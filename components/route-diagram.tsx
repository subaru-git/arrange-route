"use client";

import { useMemo, useState } from "react";
import { getRemainingScoreAtNode } from "@/lib/route-tree";
import { RouteGraphNode, RouteTree } from "@/lib/types/domain";

const NODE_W = 136;
const NODE_H = 56;
const X_GAP = 54;
const Y_GAP = 84;
const PAD_X = 20;
const PAD_Y = 16;

function linePath(from: RouteGraphNode, to: RouteGraphNode) {
  const sx = PAD_X + from.col * (NODE_W + X_GAP) + NODE_W;
  const sy = PAD_Y + from.row * (NODE_H + Y_GAP) + NODE_H / 2;
  const tx = PAD_X + to.col * (NODE_W + X_GAP);
  const ty = PAD_Y + to.row * (NODE_H + Y_GAP) + NODE_H / 2;

  if (sy === ty) {
    return `M ${sx} ${sy} L ${tx} ${ty}`;
  }

  const mx = sx + (tx - sx) / 2;
  return `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${ty} L ${tx} ${ty}`;
}

function collectPathNodes(nodeId: string, parentByNode: Map<string, string | null>) {
  const ids = new Set<string>();
  let current: string | null = nodeId;
  while (current) {
    ids.add(current);
    current = parentByNode.get(current) ?? null;
  }
  return ids;
}

export function RouteDiagram({
  target,
  tree,
  selectedNodeId,
  onNodeClick,
}: {
  target: number;
  tree: RouteTree;
  selectedNodeId?: string | null;
  onNodeClick?: (nodeId: string) => void;
}) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const nodeById = useMemo(() => new Map(tree.nodes.map((n) => [n.id, n])), [tree.nodes]);

  const parentByNode = useMemo(() => {
    const m = new Map<string, string | null>();
    tree.nodes.forEach((n) => m.set(n.id, null));
    tree.edges.forEach((e) => m.set(e.to, e.from));
    return m;
  }, [tree.nodes, tree.edges]);

  const maxCol = useMemo(() => Math.max(...tree.nodes.map((n) => n.col)), [tree.nodes]);
  const maxRow = useMemo(() => Math.max(...tree.nodes.map((n) => n.row)), [tree.nodes]);

  const width = PAD_X * 2 + (maxCol + 1) * NODE_W + maxCol * X_GAP;
  const height = PAD_Y * 2 + (maxRow + 1) * NODE_H + maxRow * Y_GAP;

  const highlightedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    return collectPathNodes(hoveredNodeId, parentByNode);
  }, [hoveredNodeId, parentByNode]);

  const highlightedEdgeIds = useMemo(() => {
    const ids = new Set<string>();
    tree.edges.forEach((e) => {
      if (highlightedNodeIds.has(e.from) && highlightedNodeIds.has(e.to)) {
        ids.add(`${e.from}->${e.to}`);
      }
    });
    return ids;
  }, [highlightedNodeIds, tree.edges]);

  const inactiveEdges = tree.edges.filter((e) => !highlightedEdgeIds.has(`${e.from}->${e.to}`));
  const activeEdges = tree.edges.filter((e) => highlightedEdgeIds.has(`${e.from}->${e.to}`));

  return (
    <div className="route-diagram">
      <div className="route-canvas" style={{ width, height }}>
        <svg className="route-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <marker
              id="route-arrow"
              markerWidth="10"
              markerHeight="8"
              refX="9"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L10,4 L0,8 z" fill="#7a828a" />
            </marker>
            <marker
              id="route-arrow-active"
              markerWidth="10"
              markerHeight="8"
              refX="9"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L10,4 L0,8 z" fill="#58a6ff" />
            </marker>
          </defs>

          {inactiveEdges.map((e) => {
            const from = nodeById.get(e.from);
            const to = nodeById.get(e.to);
            if (!from || !to) return null;
            return (
              <path
                key={`${e.from}->${e.to}`}
                d={linePath(from, to)}
                className="route-line"
                markerEnd="url(#route-arrow)"
              />
            );
          })}

          {activeEdges.map((e) => {
            const from = nodeById.get(e.from);
            const to = nodeById.get(e.to);
            if (!from || !to) return null;
            return (
              <path
                key={`${e.from}->${e.to}`}
                d={linePath(from, to)}
                className="route-line route-line-active"
                markerEnd="url(#route-arrow-active)"
              />
            );
          })}
        </svg>

        {tree.nodes.map((n) => {
          const active = highlightedNodeIds.has(n.id);
          const selected = selectedNodeId === n.id;
          const left = PAD_X + n.col * (NODE_W + X_GAP);
          const top = PAD_Y + n.row * (NODE_H + Y_GAP);
          const label = n.id === tree.targetNodeId ? `target: ${target}` : n.token;
          const remaining = getRemainingScoreAtNode(tree, target, n.id);
          return (
            <button
              key={n.id}
              type="button"
              className={
                selected
                  ? "route-node route-node-selected"
                  : active
                    ? "route-node route-node-active"
                    : "route-node"
              }
              style={{ left, top, width: NODE_W, height: NODE_H }}
              onMouseEnter={() => setHoveredNodeId(n.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onFocus={() => setHoveredNodeId(n.id)}
              onBlur={() => setHoveredNodeId(null)}
              onClick={() => onNodeClick?.(n.id)}
            >
              <span className="route-node-remaining">{remaining}</span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
