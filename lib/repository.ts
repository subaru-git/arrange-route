import { randomUUID } from "crypto";
import { normalizeRouteTree } from "@/lib/route-tree";
import { getSupabaseClient, hasSupabase } from "@/lib/supabase/client";
import {
  BullMode,
  CommentItem,
  OutRule,
  PostCardItem,
  RouteTree,
  ScoreQuery,
  SortMode,
} from "@/lib/types/domain";

const demoNow = new Date().toISOString();

const demoPosts: PostCardItem[] = [
  {
    id: "demo-1",
    remainingScore: 70,
    dartsLeft: 2,
    outRule: "double_out",
    bullMode: "separate",
    routeTree: {
      targetNodeId: "target",
      nodes: [
        { id: "target", token: "target", col: 0, row: 0 },
        { id: "m1", token: "T20", col: 1, row: 0 },
        { id: "m2", token: "D5", col: 2, row: 0 },
        { id: "b1", token: "S20", col: 1, row: 1 },
        { id: "b2", token: "BULL", col: 2, row: 1 },
      ],
      edges: [
        { from: "target", to: "m1" },
        { from: "m1", to: "m2" },
        { from: "target", to: "b1" },
        { from: "b1", to: "b2" },
      ],
    },
    voteScore: 12,
    upCount: 15,
    downCount: 3,
    commentCount: 1,
    comments: [
      {
        id: "dc-1",
        postId: "demo-1",
        body: "実戦だとこのルートが安定。",
        authorName: "demo_user",
        createdAt: demoNow,
      },
    ],
    authorName: "demo_user",
    createdAt: demoNow,
  },
  {
    id: "demo-2",
    remainingScore: 70,
    dartsLeft: 2,
    outRule: "single_out",
    bullMode: "fat",
    routeTree: {
      targetNodeId: "target",
      nodes: [
        { id: "target", token: "target", col: 0, row: 0 },
        { id: "m1", token: "BULL", col: 1, row: 0 },
        { id: "m2", token: "D10", col: 2, row: 0 },
        { id: "b1", token: "S20", col: 2, row: 1 },
        { id: "b2", token: "D15", col: 3, row: 1 },
      ],
      edges: [
        { from: "target", to: "m1" },
        { from: "m1", to: "m2" },
        { from: "m1", to: "b1" },
        { from: "b1", to: "b2" },
      ],
    },
    voteScore: 5,
    upCount: 8,
    downCount: 3,
    commentCount: 0,
    comments: [],
    authorName: "arranger",
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
];

function sortPosts(items: PostCardItem[], sort: SortMode) {
  if (sort === "latest") {
    return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return [...items].sort((a, b) => {
    if (b.voteScore !== a.voteScore) return b.voteScore - a.voteScore;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function listPosts(query: ScoreQuery): Promise<PostCardItem[]> {
  const sort = query.sort ?? "popular";

  if (!hasSupabase) {
    const filtered = demoPosts.filter((p) => {
      if (p.remainingScore !== query.remainingScore) return false;
      if (query.outRule && p.outRule !== query.outRule) return false;
      if (query.bullMode && p.bullMode !== query.bullMode) return false;
      return true;
    });
    return sortPosts(filtered, sort);
  }

  const supabase = getSupabaseClient();

  let q = supabase
    .from("posts")
    .select(
      "id,author_user_id,remaining_score,darts_left,out_rule,bull_mode,route_tree,created_at"
    )
    .eq("remaining_score", query.remainingScore)
    .is("deleted_at", null);

  if (query.outRule) q = q.eq("out_rule", query.outRule);
  if (query.bullMode) q = q.eq("bull_mode", query.bullMode);

  const { data: posts, error } = await q;
  if (error) throw error;

  if (!posts || posts.length === 0) return [];

  const ids = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_user_id))];

  const [{ data: votes }, { data: comments }, { data: profiles }] = await Promise.all([
    supabase.from("votes").select("post_id,vote_type").in("post_id", ids),
    supabase
      .from("comments")
      .select("id,post_id,body,created_at,author_user_id")
      .in("post_id", ids)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("id,display_name").in("id", authorIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  const commentsByPost = new Map<string, CommentItem[]>();
  (comments ?? []).forEach((c) => {
    const arr = commentsByPost.get(c.post_id) ?? [];
    arr.push({
      id: c.id,
      postId: c.post_id,
      body: c.body,
      authorName: profileMap.get(c.author_user_id) ?? "unknown",
      createdAt: c.created_at,
    });
    commentsByPost.set(c.post_id, arr);
  });

  const voteMap = new Map<string, { up: number; down: number }>();
  (votes ?? []).forEach((v) => {
    const agg = voteMap.get(v.post_id) ?? { up: 0, down: 0 };
    if (v.vote_type === "up") agg.up += 1;
    if (v.vote_type === "down") agg.down += 1;
    voteMap.set(v.post_id, agg);
  });

  const result: PostCardItem[] = posts.map((p) => {
    const v = voteMap.get(p.id) ?? { up: 0, down: 0 };
    const cmts = commentsByPost.get(p.id) ?? [];

    return {
      id: p.id,
      remainingScore: p.remaining_score,
      dartsLeft: p.darts_left,
      outRule: p.out_rule,
      bullMode: p.bull_mode,
      routeTree: normalizeRouteTree(p.route_tree),
      voteScore: v.up - v.down,
      upCount: v.up,
      downCount: v.down,
      commentCount: cmts.length,
      comments: cmts,
      authorName: profileMap.get(p.author_user_id) ?? "unknown",
      createdAt: p.created_at,
    };
  });

  return sortPosts(result, sort);
}

export async function createPost(input: {
  authorUserId: string;
  remainingScore: number;
  dartsLeft: number;
  outRule: OutRule;
  bullMode: BullMode;
  routeTree: RouteTree;
  initialComment?: string;
}) {
  if (!hasSupabase) return { id: randomUUID() };

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_user_id: input.authorUserId,
      remaining_score: input.remainingScore,
      darts_left: input.dartsLeft,
      out_rule: input.outRule,
      bull_mode: input.bullMode,
      route_tree: input.routeTree,
    })
    .select("id")
    .single();

  if (error) throw error;

  if (input.initialComment && input.initialComment.trim()) {
    const { error: commentError } = await supabase.from("comments").insert({
      post_id: data.id,
      author_user_id: input.authorUserId,
      body: input.initialComment.trim(),
    });
    if (commentError) throw commentError;
  }

  return data;
}

export async function upsertVote(input: {
  postId: string;
  voteType: "up" | "down";
  userId?: string;
  browserId?: string;
}) {
  if (!hasSupabase) return;
  const supabase = getSupabaseClient();

  if (input.userId) {
    const { error } = await supabase.from("votes").upsert(
      {
        post_id: input.postId,
        user_id: input.userId,
        vote_type: input.voteType,
      },
      {
        onConflict: "post_id,user_id",
      }
    );
    if (error) throw error;
    return;
  }

  if (!input.browserId) throw new Error("browserId is required for guest vote");

  const { error } = await supabase.from("votes").upsert(
    {
      post_id: input.postId,
      browser_id: input.browserId,
      vote_type: input.voteType,
    },
    {
      onConflict: "post_id,browser_id",
    }
  );

  if (error) throw error;
}

export async function deleteVote(input: {
  postId: string;
  userId?: string;
  browserId?: string;
}) {
  if (!hasSupabase) return;
  const supabase = getSupabaseClient();

  if (input.userId) {
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("post_id", input.postId)
      .eq("user_id", input.userId);
    if (error) throw error;
    return;
  }

  if (!input.browserId) throw new Error("browserId is required for guest vote removal");
  const { error } = await supabase
    .from("votes")
    .delete()
    .eq("post_id", input.postId)
    .eq("browser_id", input.browserId);

  if (error) throw error;
}

export async function createComment(input: {
  postId: string;
  authorUserId: string;
  body: string;
}) {
  if (!hasSupabase) return;
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("comments").insert({
    post_id: input.postId,
    author_user_id: input.authorUserId,
    body: input.body,
  });
  if (error) throw error;
}
