import { RouteGraphEdge, RouteGraphNode, RouteTree } from "@/lib/types/domain";

const TARGET_ID = "target";

function isGraphRouteTree(value: unknown): value is RouteTree {
  if (!value || typeof value !== "object") return false;
  const v = value as RouteTree;
  return Array.isArray(v.nodes) && Array.isArray(v.edges) && typeof v.targetNodeId === "string";
}

type LegacyRouteTree = {
  main?: Array<{ token: string }>;
  miss?: Array<{ token: string }>;
  missFromNodeId?: string | null;
};

function isLegacyRouteTree(value: unknown): value is LegacyRouteTree {
  if (!value || typeof value !== "object") return false;
  const v = value as LegacyRouteTree;
  return Array.isArray(v.main) || Array.isArray(v.miss);
}

export function createInitialRouteTree(): RouteTree {
  return {
    targetNodeId: TARGET_ID,
    nodes: [{ id: TARGET_ID, token: TARGET_ID, col: 0, row: 0 }],
    edges: [],
  };
}

export function normalizeRouteTree(raw: unknown): RouteTree {
  if (isGraphRouteTree(raw)) return raw;

  if (isLegacyRouteTree(raw)) {
    const nodes: RouteGraphNode[] = [{ id: TARGET_ID, token: TARGET_ID, col: 0, row: 0 }];
    const edges: RouteGraphEdge[] = [];

    let prev = TARGET_ID;
    (raw.main ?? []).forEach((n, i) => {
      const id = `main-${i}`;
      nodes.push({ id, token: n.token, col: i + 1, row: 0 });
      edges.push({ from: prev, to: id });
      prev = id;
    });

    const branchFrom = raw.missFromNodeId ?? TARGET_ID;
    let branchPrev = branchFrom;
    (raw.miss ?? []).forEach((n, i) => {
      const id = `branch-${i}`;
      nodes.push({ id, token: n.token, col: i + 1, row: 1 });
      edges.push({ from: branchPrev, to: id });
      branchPrev = id;
    });

    return {
      targetNodeId: TARGET_ID,
      nodes,
      edges,
    };
  }

  return createInitialRouteTree();
}

export function getNodeById(tree: RouteTree, id: string) {
  return tree.nodes.find((n) => n.id === id) ?? null;
}

export function tokenScore(token: string) {
  if (token === "BULL" || token === "Bull" || token === "DBULL" || token === "D-BULL") {
    return 50;
  }
  if (token === "25" || token === "SBULL" || token === "S-BULL") {
    return 25;
  }

  const s = token.match(/^S(\d{1,2})$/);
  if (s) return Number(s[1]);
  const d = token.match(/^D(\d{1,2})$/);
  if (d) return Number(d[1]) * 2;
  const t = token.match(/^T(\d{1,2})$/);
  if (t) return Number(t[1]) * 3;
  const single = token.match(/^\d{1,2}$/);
  if (single) return Number(single[0]);
  return 0;
}

export function buildParentMap(tree: RouteTree) {
  const m = new Map<string, string | null>();
  tree.nodes.forEach((n) => m.set(n.id, null));
  tree.edges.forEach((e) => m.set(e.to, e.from));
  return m;
}

export function getPathNodeIds(tree: RouteTree, nodeId: string) {
  const parent = buildParentMap(tree);
  const path: string[] = [];
  let cur: string | null = nodeId;
  while (cur) {
    path.push(cur);
    cur = parent.get(cur) ?? null;
  }
  path.reverse();
  return path;
}

export function getThrowsUsedAtNode(tree: RouteTree, nodeId: string) {
  const path = getPathNodeIds(tree, nodeId);
  return Math.max(0, path.length - 1);
}

export function getRemainingScoreAtNode(tree: RouteTree, targetScore: number, nodeId: string) {
  const path = getPathNodeIds(tree, nodeId);
  const sum = path
    .slice(1)
    .map((id) => tree.nodes.find((n) => n.id === id)?.token ?? "")
    .reduce((acc, token) => acc + tokenScore(token), 0);
  return targetScore - sum;
}

export function addTokenToSelectedNode(tree: RouteTree, selectedNodeId: string, token: string) {
  const selected = getNodeById(tree, selectedNodeId);
  if (!selected) return { tree, selectedNodeId: tree.targetNodeId };

  const nextCol = selected.col + 1;
  const candidates = tree.nodes.filter((n) => n.col === nextCol && n.row >= selected.row);
  const nextRow = candidates.length === 0 ? selected.row : Math.max(...candidates.map((n) => n.row)) + 1;

  const newId = `n-${crypto.randomUUID()}`;
  const newNode: RouteGraphNode = {
    id: newId,
    token,
    col: nextCol,
    row: nextRow,
  };

  return {
    tree: {
      ...tree,
      nodes: [...tree.nodes, newNode],
      edges: [...tree.edges, { from: selectedNodeId, to: newId }],
    },
    selectedNodeId: newId,
  };
}

export function removeSelectedSubtree(tree: RouteTree, selectedNodeId: string) {
  if (selectedNodeId === tree.targetNodeId) return { tree, selectedNodeId };

  const childrenMap = new Map<string, string[]>();
  tree.edges.forEach((e) => {
    const arr = childrenMap.get(e.from) ?? [];
    arr.push(e.to);
    childrenMap.set(e.from, arr);
  });

  const toDelete = new Set<string>();
  const stack = [selectedNodeId];
  while (stack.length) {
    const cur = stack.pop()!;
    if (toDelete.has(cur)) continue;
    toDelete.add(cur);
    (childrenMap.get(cur) ?? []).forEach((c) => stack.push(c));
  }

  const parentEdge = tree.edges.find((e) => e.to === selectedNodeId);
  const fallback = parentEdge?.from ?? tree.targetNodeId;

  return {
    tree: {
      ...tree,
      nodes: tree.nodes.filter((n) => !toDelete.has(n.id)),
      edges: tree.edges.filter((e) => !toDelete.has(e.from) && !toDelete.has(e.to)),
    },
    selectedNodeId: fallback,
  };
}
