export type OutRule = "double_out" | "master_out" | "single_out";
export type BullMode = "separate" | "fat";
export type SortMode = "popular" | "latest";

export interface RouteGraphNode {
  id: string;
  token: string;
  col: number;
  row: number;
}

export interface RouteGraphEdge {
  from: string;
  to: string;
}

export interface RouteTree {
  targetNodeId: string;
  nodes: RouteGraphNode[];
  edges: RouteGraphEdge[];
}

export interface CommentItem {
  id: string;
  postId: string;
  body: string;
  authorName: string;
  createdAt: string;
}

export interface PostCardItem {
  id: string;
  remainingScore: number;
  dartsLeft: number;
  outRule: OutRule;
  bullMode: BullMode;
  routeTree: RouteTree;
  voteScore: number;
  upCount: number;
  downCount: number;
  commentCount: number;
  comments: CommentItem[];
  authorName: string;
  createdAt: string;
  viewerHasUpvoted?: boolean;
}

export interface ScoreQuery {
  remainingScore: number;
  outRule?: OutRule;
  bullMode?: BullMode;
  sort?: SortMode;
}
