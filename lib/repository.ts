import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeRouteTree } from "@/lib/route-tree";
import { getSupabaseClient, hasSupabase, hasSupabaseAdmin } from "@/lib/supabase/client";
import {
  BullMode,
  CommentItem,
  OutRule,
  PostCardItem,
  RouteTree,
  ScoreQuery,
  SortMode,
} from "@/lib/types/domain";

type ProfileSummary = {
  displayName: string;
  avatarUrl: string | null;
};

const demoNow = new Date().toISOString();

declare global {
  var __arrangeWikiDemoVotes: Map<string, "up" | "down"> | undefined;
}

const demoVotes =
  globalThis.__arrangeWikiDemoVotes ??
  (globalThis.__arrangeWikiDemoVotes = new Map<string, "up" | "down">());

const useDemoData = process.env.NODE_ENV === "development" && !hasSupabase;

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
        { id: "r1-1", token: "T20", col: 1, row: 0 },
        { id: "r1-2", token: "D5", col: 2, row: 0 },
        { id: "r2-1", token: "S20", col: 1, row: 1 },
        { id: "r2-2", token: "S18", col: 2, row: 1 },
        { id: "r2-3", token: "D16", col: 3, row: 1 },
        { id: "r3-2", token: "S10", col: 2, row: 2 },
        { id: "r3-3", token: "D20", col: 3, row: 2 },
        { id: "r4-1", token: "T10", col: 1, row: 3 },
        { id: "r4-2", token: "D20", col: 2, row: 3 },
        { id: "r5-1", token: "S10", col: 1, row: 4 },
        { id: "r5-2", token: "S20", col: 2, row: 4 },
        { id: "r5-3", token: "D20", col: 3, row: 4 },
      ],
      edges: [
        { from: "target", to: "r1-1" },
        { from: "r1-1", to: "r1-2" },
        { from: "target", to: "r2-1" },
        { from: "r2-1", to: "r2-2" },
        { from: "r2-2", to: "r2-3" },
        { from: "r2-1", to: "r3-2" },
        { from: "r3-2", to: "r3-3" },
        { from: "target", to: "r4-1" },
        { from: "r4-1", to: "r4-2" },
        { from: "target", to: "r5-1" },
        { from: "r5-1", to: "r5-2" },
        { from: "r5-2", to: "r5-3" },
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
  {
    id: "demo-3",
    remainingScore: 70,
    dartsLeft: 3,
    outRule: "double_out",
    bullMode: "separate",
    routeTree: {
      targetNodeId: "target",
      nodes: [
        { id: "target", token: "target", col: 0, row: 0 },
        { id: "m1", token: "T18", col: 1, row: 0 },
        { id: "m2", token: "D8", col: 2, row: 0 },
        { id: "b1", token: "S18", col: 1, row: 1 },
        { id: "b2", token: "S20", col: 2, row: 1 },
        { id: "b3", token: "D16", col: 3, row: 1 },
      ],
      edges: [
        { from: "target", to: "m1" },
        { from: "m1", to: "m2" },
        { from: "target", to: "b1" },
        { from: "b1", to: "b2" },
        { from: "b2", to: "b3" },
      ],
    },
    voteScore: 0,
    upCount: 0,
    downCount: 0,
    commentCount: 0,
    comments: [],
    authorName: "fixture",
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
  },
  {
    id: "demo-4",
    remainingScore: 70,
    dartsLeft: 3,
    outRule: "master_out",
    bullMode: "fat",
    routeTree: {
      targetNodeId: "target",
      nodes: [
        { id: "target", token: "target", col: 0, row: 0 },
        { id: "m1", token: "T10", col: 1, row: 0 },
        { id: "m2", token: "D20", col: 2, row: 0 },
        { id: "b1", token: "S10", col: 1, row: 1 },
        { id: "b2", token: "S20", col: 2, row: 1 },
        { id: "b3", token: "D20", col: 3, row: 1 },
      ],
      edges: [
        { from: "target", to: "m1" },
        { from: "m1", to: "m2" },
        { from: "target", to: "b1" },
        { from: "b1", to: "b2" },
        { from: "b2", to: "b3" },
      ],
    },
    voteScore: 0,
    upCount: 0,
    downCount: 0,
    commentCount: 0,
    comments: [],
    authorName: "fixture",
    createdAt: new Date(Date.now() - 10_800_000).toISOString(),
  },
  {
    id: "demo-5",
    remainingScore: 70,
    dartsLeft: 2,
    outRule: "single_out",
    bullMode: "separate",
    routeTree: {
      targetNodeId: "target",
      nodes: [
        { id: "target", token: "target", col: 0, row: 0 },
        { id: "m1", token: "S20", col: 1, row: 0 },
        { id: "m2", token: "BULL", col: 2, row: 0 },
        { id: "b1", token: "S10", col: 1, row: 1 },
        { id: "b2", token: "T20", col: 2, row: 1 },
      ],
      edges: [
        { from: "target", to: "m1" },
        { from: "m1", to: "m2" },
        { from: "target", to: "b1" },
        { from: "b1", to: "b2" },
      ],
    },
    voteScore: 0,
    upCount: 0,
    downCount: 0,
    commentCount: 0,
    comments: [],
    authorName: "fixture",
    createdAt: new Date(Date.now() - 14_400_000).toISOString(),
  },
  {
    id: "demo-6",
    remainingScore: 70,
    dartsLeft: 3,
    outRule: "double_out",
    bullMode: "separate",
    routeTree: {
      targetNodeId: "target",
      nodes: [
        { id: "target", token: "target", col: 0, row: 0 },
        { id: "a1", token: "S20", col: 1, row: 0 },
        { id: "a2", token: "T10", col: 2, row: 0 },
        { id: "a3", token: "D10", col: 3, row: 0 },
        { id: "b1", token: "T18", col: 1, row: 1 },
        { id: "b2", token: "D8", col: 2, row: 1 },
        { id: "c1", token: "S18", col: 1, row: 2 },
        { id: "c2", token: "T16", col: 2, row: 2 },
        { id: "c3", token: "D2", col: 3, row: 2 },
      ],
      edges: [
        { from: "target", to: "a1" },
        { from: "a1", to: "a2" },
        { from: "a2", to: "a3" },
        { from: "target", to: "b1" },
        { from: "b1", to: "b2" },
        { from: "target", to: "c1" },
        { from: "c1", to: "c2" },
        { from: "c2", to: "c3" },
      ],
    },
    voteScore: 0,
    upCount: 0,
    downCount: 0,
    commentCount: 0,
    comments: [],
    authorName: "fixture",
    createdAt: new Date(Date.now() - 18_000_000).toISOString(),
  },
  {
    id: "demo-7",
    remainingScore: 70,
    dartsLeft: 3,
    outRule: "double_out",
    bullMode: "separate",
    routeTree: {
      targetNodeId: "target",
      nodes: [
        { id: "target", token: "target", col: 0, row: 0 },
        { id: "a1", token: "T12", col: 1, row: 0 },
        { id: "a2", token: "D17", col: 2, row: 0 },
        { id: "b1", token: "S12", col: 1, row: 1 },
        { id: "b2", token: "S18", col: 2, row: 1 },
        { id: "b3", token: "D20", col: 3, row: 1 },
        { id: "c1", token: "S16", col: 1, row: 2 },
        { id: "c2", token: "T18", col: 2, row: 2 },
      ],
      edges: [
        { from: "target", to: "a1" },
        { from: "a1", to: "a2" },
        { from: "target", to: "b1" },
        { from: "b1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "target", to: "c1" },
        { from: "c1", to: "c2" },
      ],
    },
    voteScore: 0,
    upCount: 0,
    downCount: 0,
    commentCount: 0,
    comments: [],
    authorName: "fixture",
    createdAt: new Date(Date.now() - 21_600_000).toISOString(),
  },
  {
    id: "demo-8",
    remainingScore: 70,
    dartsLeft: 3,
    outRule: "double_out",
    bullMode: "separate",
    routeTree: {
      targetNodeId: "target",
      nodes: [
        { id: "target", token: "target", col: 0, row: 0 },
        { id: "a1", token: "T20", col: 1, row: 0 },
        { id: "a2", token: "D5", col: 2, row: 0 },
        { id: "b1", token: "S20", col: 1, row: 1 },
        { id: "b2", token: "T14", col: 2, row: 1 },
        { id: "b3", token: "D4", col: 3, row: 1 },
        { id: "c1", token: "S14", col: 1, row: 2 },
        { id: "c2", token: "S16", col: 2, row: 2 },
        { id: "c3", token: "D20", col: 3, row: 2 },
        { id: "d1", token: "T16", col: 1, row: 3 },
        { id: "d2", token: "D11", col: 2, row: 3 },
      ],
      edges: [
        { from: "target", to: "a1" },
        { from: "a1", to: "a2" },
        { from: "target", to: "b1" },
        { from: "b1", to: "b2" },
        { from: "b2", to: "b3" },
        { from: "target", to: "c1" },
        { from: "c1", to: "c2" },
        { from: "c2", to: "c3" },
        { from: "target", to: "d1" },
        { from: "d1", to: "d2" },
      ],
    },
    voteScore: 0,
    upCount: 0,
    downCount: 0,
    commentCount: 0,
    comments: [],
    authorName: "fixture",
    createdAt: new Date(Date.now() - 25_200_000).toISOString(),
  },
  {
    id: "demo-9",
    remainingScore: 70,
    dartsLeft: 2,
    outRule: "double_out",
    bullMode: "fat",
    routeTree: {
      targetNodeId: "target",
      nodes: [
        { id: "target", token: "target", col: 0, row: 0 },
        { id: "a1", token: "BULL", col: 1, row: 0 },
        { id: "a2", token: "D10", col: 2, row: 0 },
        { id: "b1", token: "T18", col: 1, row: 1 },
        { id: "b2", token: "D8", col: 2, row: 1 },
        { id: "c1", token: "S20", col: 1, row: 2 },
        { id: "c2", token: "S18", col: 2, row: 2 },
        { id: "c3", token: "D16", col: 3, row: 2 },
      ],
      edges: [
        { from: "target", to: "a1" },
        { from: "a1", to: "a2" },
        { from: "target", to: "b1" },
        { from: "b1", to: "b2" },
        { from: "target", to: "c1" },
        { from: "c1", to: "c2" },
        { from: "c2", to: "c3" },
      ],
    },
    voteScore: 0,
    upCount: 0,
    downCount: 0,
    commentCount: 0,
    comments: [],
    authorName: "fixture",
    createdAt: new Date(Date.now() - 28_800_000).toISOString(),
  },
  {
    id: "demo-10",
    remainingScore: 70,
    dartsLeft: 3,
    outRule: "master_out",
    bullMode: "separate",
    routeTree: {
      targetNodeId: "target",
      nodes: [
        { id: "target", token: "target", col: 0, row: 0 },
        { id: "a1", token: "S20", col: 1, row: 0 },
        { id: "a2", token: "BULL", col: 2, row: 0 },
        { id: "b1", token: "T10", col: 1, row: 1 },
        { id: "b2", token: "D20", col: 2, row: 1 },
        { id: "c1", token: "S10", col: 1, row: 2 },
        { id: "c2", token: "S20", col: 2, row: 2 },
        { id: "c3", token: "D20", col: 3, row: 2 },
      ],
      edges: [
        { from: "target", to: "a1" },
        { from: "a1", to: "a2" },
        { from: "target", to: "b1" },
        { from: "b1", to: "b2" },
        { from: "target", to: "c1" },
        { from: "c1", to: "c2" },
        { from: "c2", to: "c3" },
      ],
    },
    voteScore: 0,
    upCount: 0,
    downCount: 0,
    commentCount: 0,
    comments: [],
    authorName: "fixture",
    createdAt: new Date(Date.now() - 32_400_000).toISOString(),
  },
];

function demoVoteKey(input: { postId: string; userId?: string; browserId?: string }) {
  const voterId = input.userId ? `user:${input.userId}` : `browser:${input.browserId}`;
  return `${input.postId}:${voterId}`;
}

function listDemoPosts(query: ScoreQuery, sort: SortMode, viewerBrowserId?: string) {
  const filtered = demoPosts.filter((p) => {
    if (p.remainingScore !== query.remainingScore) return false;
    if (query.outRule && p.outRule !== query.outRule) return false;
    if (query.bullMode && p.bullMode !== query.bullMode) return false;
    return true;
  });
  return sortPosts(
    filtered.map((post) => {
      let addedUpCount = 0;
      let addedDownCount = 0;
      for (const [key, voteType] of demoVotes) {
        if (!key.startsWith(`${post.id}:`)) continue;
        if (voteType === "up") addedUpCount += 1;
        if (voteType === "down") addedDownCount += 1;
      }

      return {
        ...post,
        upCount: post.upCount + addedUpCount,
        downCount: post.downCount + addedDownCount,
        voteScore: post.voteScore + addedUpCount - addedDownCount,
        viewerHasUpvoted: viewerBrowserId
          ? demoVotes.get(demoVoteKey({ postId: post.id, browserId: viewerBrowserId })) === "up"
          : false,
      };
    }),
    sort
  );
}

function sortPosts(items: PostCardItem[], sort: SortMode) {
  if (sort === "latest") {
    return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return [...items].sort((a, b) => {
    if (b.voteScore !== a.voteScore) return b.voteScore - a.voteScore;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function listPosts(
  query: ScoreQuery,
  viewerBrowserId?: string,
  viewerUserId?: string
): Promise<PostCardItem[]> {
  const sort = query.sort ?? "popular";

  if (useDemoData) {
    return listDemoPosts(query, sort, viewerBrowserId);
  }
  if (!hasSupabase) {
    throw new Error("Supabase env vars are required outside development");
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

  const [
    { data: votes, error: votesError },
    { data: comments, error: commentsError },
    { data: profiles, error: profilesError },
    viewerVotesResult,
  ] = await Promise.all([
    supabase.from("votes").select("post_id,vote_type").in("post_id", ids),
    supabase
      .from("comments")
      .select("id,post_id,body,created_at,author_user_id")
      .in("post_id", ids)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("id,display_name,avatar_url").in("id", authorIds),
    viewerBrowserId
      ? supabase
          .from("votes")
          .select("post_id")
          .in("post_id", ids)
          .eq("browser_id", viewerBrowserId)
          .eq("vote_type", "up")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (votesError) throw votesError;
  if (commentsError) throw commentsError;
  if (profilesError) throw profilesError;
  if (viewerVotesResult.error) throw viewerVotesResult.error;

  const profileMap = new Map<string, ProfileSummary>(
    (profiles ?? []).map((p) => [
      p.id,
      { displayName: p.display_name, avatarUrl: p.avatar_url ?? null },
    ])
  );
  const viewerUpvotedPostIds = new Set(
    (viewerVotesResult.data ?? []).map((vote) => vote.post_id)
  );

  const commentsByPost = new Map<string, CommentItem[]>();
  (comments ?? []).forEach((c) => {
    const arr = commentsByPost.get(c.post_id) ?? [];
    arr.push({
      id: c.id,
      postId: c.post_id,
      body: c.body,
      authorName: profileMap.get(c.author_user_id)?.displayName ?? "unknown",
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
      authorUserId: p.author_user_id,
      authorName: profileMap.get(p.author_user_id)?.displayName ?? "unknown",
      authorAvatarUrl: profileMap.get(p.author_user_id)?.avatarUrl ?? null,
      createdAt: p.created_at,
      viewerHasUpvoted: viewerUpvotedPostIds.has(p.id),
      canManage: viewerUserId === p.author_user_id,
    };
  });

  return sortPosts(result, sort);
}

export async function createPost(input: {
  supabaseClient?: SupabaseClient;
  authorUserId: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
  remainingScore: number;
  dartsLeft: number;
  outRule: OutRule;
  bullMode: BullMode;
  routeTree: RouteTree;
  initialComment?: string;
}) {
  if (useDemoData) {
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    demoPosts.unshift({
      id,
      remainingScore: input.remainingScore,
      dartsLeft: input.dartsLeft,
      outRule: input.outRule,
      bullMode: input.bullMode,
      routeTree: input.routeTree,
      voteScore: 0,
      upCount: 0,
      downCount: 0,
      commentCount: input.initialComment?.trim() ? 1 : 0,
      comments: input.initialComment?.trim()
        ? [
            {
              id: randomUUID(),
              postId: id,
              body: input.initialComment.trim(),
              authorName: input.authorName ?? "demo_user",
              createdAt,
            },
          ]
        : [],
      authorUserId: input.authorUserId,
      authorName: input.authorName ?? "demo_user",
      authorAvatarUrl: input.authorAvatarUrl ?? null,
      createdAt,
    });

    return { id };
  }
  if (!hasSupabase) {
    throw new Error("Supabase env vars are required outside development");
  }

  if (!input.supabaseClient && !hasSupabaseAdmin) {
    throw new Error(
      "Authenticated Supabase client or service role key is required to save posts"
    );
  }

  const supabase = input.supabaseClient ?? getSupabaseClient({ admin: true });
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: input.authorUserId,
    display_name: input.authorName ?? "demo_user",
    avatar_url: input.authorAvatarUrl ?? null,
  });
  if (profileError) throw profileError;

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

export async function getPost(postId: string): Promise<PostCardItem | null> {
  if (useDemoData) {
    return demoPosts.find((post) => post.id === postId) ?? null;
  }

  if (!hasSupabase) {
    throw new Error("Supabase env vars are required outside development");
  }

  const supabase = getSupabaseClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select(
      "id,author_user_id,remaining_score,darts_left,out_rule,bull_mode,route_tree,created_at"
    )
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!post) return null;

  const [
    { data: votes, error: votesError },
    { data: comments, error: commentsError },
    { data: profiles, error: profilesError },
  ] = await Promise.all([
    supabase.from("votes").select("vote_type").eq("post_id", post.id),
    supabase
      .from("comments")
      .select("id,post_id,body,created_at,author_user_id")
      .eq("post_id", post.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id,display_name,avatar_url")
      .eq("id", post.author_user_id),
  ]);

  if (votesError) throw votesError;
  if (commentsError) throw commentsError;
  if (profilesError) throw profilesError;

  const profileMap = new Map<string, ProfileSummary>(
    (profiles ?? []).map((p) => [
      p.id,
      { displayName: p.display_name, avatarUrl: p.avatar_url ?? null },
    ])
  );
  const upCount = (votes ?? []).filter((vote) => vote.vote_type === "up").length;
  const downCount = (votes ?? []).filter((vote) => vote.vote_type === "down").length;
  const commentItems: CommentItem[] = (comments ?? []).map((comment) => ({
    id: comment.id,
    postId: comment.post_id,
    body: comment.body,
    authorName: profileMap.get(comment.author_user_id)?.displayName ?? "unknown",
    createdAt: comment.created_at,
  }));

  return {
    id: post.id,
    remainingScore: post.remaining_score,
    dartsLeft: post.darts_left,
    outRule: post.out_rule,
    bullMode: post.bull_mode,
    routeTree: normalizeRouteTree(post.route_tree),
    voteScore: upCount - downCount,
    upCount,
    downCount,
    commentCount: commentItems.length,
    comments: commentItems,
    authorUserId: post.author_user_id,
    authorName: profileMap.get(post.author_user_id)?.displayName ?? "unknown",
    authorAvatarUrl: profileMap.get(post.author_user_id)?.avatarUrl ?? null,
    createdAt: post.created_at,
  };
}

export async function updatePost(input: {
  supabaseClient?: SupabaseClient;
  authorUserId?: string;
  postId: string;
  remainingScore: number;
  dartsLeft: number;
  outRule: OutRule;
  bullMode: BullMode;
  routeTree: RouteTree;
}) {
  if (useDemoData) {
    const post = demoPosts.find(
      (item) =>
        item.id === input.postId &&
        (!input.authorUserId || item.authorUserId === input.authorUserId)
    );
    if (!post) throw new Error("Post not found");

    post.remainingScore = input.remainingScore;
    post.dartsLeft = input.dartsLeft;
    post.outRule = input.outRule;
    post.bullMode = input.bullMode;
    post.routeTree = input.routeTree;
    return;
  }

  if (!hasSupabase) {
    throw new Error("Supabase env vars are required outside development");
  }

  if (!input.supabaseClient && !hasSupabaseAdmin) {
    throw new Error(
      "Authenticated Supabase client or service role key is required to edit posts"
    );
  }

  const supabase = input.supabaseClient ?? getSupabaseClient({ admin: true });
  let q = supabase
    .from("posts")
    .update(
      {
        remaining_score: input.remainingScore,
        darts_left: input.dartsLeft,
        out_rule: input.outRule,
        bull_mode: input.bullMode,
        route_tree: input.routeTree,
      },
      { count: "exact" }
    )
    .eq("id", input.postId)
    .is("deleted_at", null);

  if (input.authorUserId) q = q.eq("author_user_id", input.authorUserId);

  const { error, count } = await q;

  if (error) throw error;
  if (count === 0) throw new Error("Post not found or not owned by user");
}

export async function deletePost(input: {
  supabaseClient?: SupabaseClient;
  authorUserId?: string;
  postId: string;
  remainingScore: number;
}) {
  if (useDemoData) {
    const index = demoPosts.findIndex(
      (post) =>
        post.id === input.postId &&
        post.remainingScore === input.remainingScore &&
        (!input.authorUserId || post.authorUserId === input.authorUserId)
    );
    if (index >= 0) demoPosts.splice(index, 1);
    return;
  }

  if (!hasSupabase) {
    throw new Error("Supabase env vars are required outside development");
  }

  if (!input.supabaseClient && !hasSupabaseAdmin) {
    throw new Error(
      "Authenticated Supabase client or service role key is required to delete posts"
    );
  }

  const supabase = input.supabaseClient ?? getSupabaseClient({ admin: true });
  let q = supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", input.postId)
    .eq("remaining_score", input.remainingScore)
    .is("deleted_at", null);

  if (input.authorUserId) q = q.eq("author_user_id", input.authorUserId);

  const { error, count } = await q;

  if (error) throw error;
  if (count === 0) throw new Error("Post not found or not owned by user");
}

export async function upsertVote(input: {
  postId: string;
  voteType: "up" | "down";
  userId?: string;
  browserId?: string;
}) {
  if (useDemoData) {
    if (!demoPosts.some((item) => item.id === input.postId)) throw new Error("Post not found");

    const key = demoVoteKey(input);
    demoVotes.set(key, input.voteType);
    return;
  }

  if (!hasSupabase) {
    throw new Error("Supabase env vars are required outside development");
  }
  const supabase = getSupabaseClient();

  if (input.userId) {
    const { data: updated, error: updateError } = await supabase
      .from("votes")
      .update({ vote_type: input.voteType })
      .eq("post_id", input.postId)
      .eq("user_id", input.userId)
      .select("id");
    if (updateError) throw updateError;
    if (updated && updated.length > 0) return;

    const { error: insertError } = await supabase.from("votes").insert({
      post_id: input.postId,
      user_id: input.userId,
      vote_type: input.voteType,
    });
    if (insertError) throw insertError;
    return;
  }

  if (!input.browserId) throw new Error("browserId is required for guest vote");

  const { data: updated, error: updateError } = await supabase
    .from("votes")
    .update({ vote_type: input.voteType })
    .eq("post_id", input.postId)
    .eq("browser_id", input.browserId)
    .select("id");
  if (updateError) throw updateError;
  if (updated && updated.length > 0) return;

  const { error: insertError } = await supabase.from("votes").insert({
    post_id: input.postId,
    browser_id: input.browserId,
    vote_type: input.voteType,
  });
  if (insertError) throw insertError;
}

export async function deleteVote(input: {
  postId: string;
  userId?: string;
  browserId?: string;
}) {
  if (useDemoData) {
    const key = demoVoteKey(input);
    demoVotes.delete(key);
    return;
  }

  if (!hasSupabase) {
    throw new Error("Supabase env vars are required outside development");
  }
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
  const supabase = getSupabaseClient({ admin: hasSupabaseAdmin });
  if (hasSupabaseAdmin) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: input.authorUserId,
      display_name: "demo_user",
    });
    if (profileError) throw profileError;
  }
  const { error } = await supabase.from("comments").insert({
    post_id: input.postId,
    author_user_id: input.authorUserId,
    body: input.body,
  });
  if (error) throw error;
}
