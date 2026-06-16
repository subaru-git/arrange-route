"use client";

import { useId, useMemo, useState } from "react";
import { getRemainingScoreAtNode } from "@/lib/route-tree";
import { RouteGraphNode, RouteTree } from "@/lib/types/domain";

const NODE_W = 52;
const NODE_H = 52;
const X_GAP = 34;
const Y_GAP = 52;
const PAD_X = 20;
const PAD_Y = 16;
const MIN_VISIBLE_COLS = 4;
const BRANCH_STUB = 18;

function getEdgePoints(from: RouteGraphNode, to: RouteGraphNode) {
  const sx = PAD_X + from.col * (NODE_W + X_GAP) + NODE_W;
  const sy = PAD_Y + from.row * (NODE_H + Y_GAP) + NODE_H / 2;
  const tx = PAD_X + to.col * (NODE_W + X_GAP);
  const ty = PAD_Y + to.row * (NODE_H + Y_GAP) + NODE_H / 2;
  const elbowX = sx + Math.min(BRANCH_STUB, Math.max(8, (tx - sx) - 12));

  return { sx, sy, tx, ty, elbowX };
}

function trunkPath(from: RouteGraphNode, to: RouteGraphNode) {
  const { sx, sy, elbowX } = getEdgePoints(from, to);
  return `M ${sx} ${sy} L ${elbowX} ${sy}`;
}

function linePath(from: RouteGraphNode, to: RouteGraphNode, hasSharedTrunk: boolean) {
  const { sx, sy, tx, ty, elbowX } = getEdgePoints(from, to);

  if (sy === ty) {
    return hasSharedTrunk ? `M ${elbowX} ${sy} L ${tx} ${ty}` : `M ${sx} ${sy} L ${tx} ${ty}`;
  }

  return hasSharedTrunk
    ? `M ${elbowX} ${sy} L ${elbowX} ${ty} L ${tx} ${ty}`
    : `M ${sx} ${sy} L ${elbowX} ${sy} L ${elbowX} ${ty} L ${tx} ${ty}`;
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
  const markerBaseId = useId().replace(/:/g, "");
  const arrowMarkerId = `${markerBaseId}-route-arrow`;
  const activeArrowMarkerId = `${markerBaseId}-route-arrow-active`;

  const nodeById = useMemo(() => new Map(tree.nodes.map((n) => [n.id, n])), [tree.nodes]);

  const parentByNode = useMemo(() => {
    const m = new Map<string, string | null>();
    tree.nodes.forEach((n) => m.set(n.id, null));
    tree.edges.forEach((e) => m.set(e.to, e.from));
    return m;
  }, [tree.nodes, tree.edges]);

  const childrenByNode = useMemo(() => {
    const m = new Map<string, string[]>();
    tree.edges.forEach((e) => {
      const children = m.get(e.from) ?? [];
      children.push(e.to);
      m.set(e.from, children);
    });
    return m;
  }, [tree.edges]);

  const maxCol = useMemo(() => Math.max(...tree.nodes.map((n) => n.col)), [tree.nodes]);
  const maxRow = useMemo(() => Math.max(...tree.nodes.map((n) => n.row)), [tree.nodes]);

  const visibleCol = Math.max(maxCol, MIN_VISIBLE_COLS - 1);
  const width = PAD_X * 2 + (visibleCol + 1) * NODE_W + visibleCol * X_GAP;
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
  const branchTrunks = [...childrenByNode.entries()].filter(([, children]) => children.length > 1);

  const isEmpty = tree.nodes.length === 1;

  return (
    <div className={isEmpty ? "route-diagram route-diagram-empty" : "route-diagram"}>
      <div className="route-canvas" style={{ width, height }}>
        <svg className="route-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <marker
              id={arrowMarkerId}
              markerWidth="10"
              markerHeight="8"
              refX="9"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L10,4 L0,8 z" fill="var(--route-arrow-color, #7a828a)" />
            </marker>
            <marker
              id={activeArrowMarkerId}
              markerWidth="10"
              markerHeight="8"
              refX="9"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L10,4 L0,8 z" fill="var(--route-arrow-active-color, #58a6ff)" />
            </marker>
          </defs>

          {branchTrunks.map(([fromId, children]) => {
            const from = nodeById.get(fromId);
            const to = nodeById.get(children[0]);
            if (!from || !to) return null;
            const active = children.some((childId) => highlightedEdgeIds.has(`${fromId}->${childId}`));
            return (
              <path
                key={`${fromId}->trunk`}
                d={trunkPath(from, to)}
                className={active ? "route-line route-line-active" : "route-line"}
              />
            );
          })}

          {inactiveEdges.map((e) => {
            const from = nodeById.get(e.from);
            const to = nodeById.get(e.to);
            if (!from || !to) return null;
            const hasSharedTrunk = (childrenByNode.get(e.from)?.length ?? 0) > 1;
            return (
              <path
                key={`${e.from}->${e.to}`}
                d={linePath(from, to, hasSharedTrunk)}
                className="route-line"
                markerEnd={`url(#${arrowMarkerId})`}
              />
            );
          })}

          {activeEdges.map((e) => {
            const from = nodeById.get(e.from);
            const to = nodeById.get(e.to);
            if (!from || !to) return null;
            const hasSharedTrunk = (childrenByNode.get(e.from)?.length ?? 0) > 1;
            return (
              <path
                key={`${e.from}->${e.to}`}
                d={linePath(from, to, hasSharedTrunk)}
                className="route-line route-line-active"
                markerEnd={`url(#${activeArrowMarkerId})`}
              />
            );
          })}
        </svg>

        {tree.nodes.map((n) => {
          const active = highlightedNodeIds.has(n.id);
          const selected = selectedNodeId === n.id;
          const left = PAD_X + n.col * (NODE_W + X_GAP);
          const top = PAD_Y + n.row * (NODE_H + Y_GAP);
          const label = n.id === tree.targetNodeId ? String(target) : n.token;
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
              aria-label={`${label}, remaining ${remaining}`}
              title={`${label} / remaining ${remaining}`}
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
