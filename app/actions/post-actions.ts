"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createComment,
  createPost,
  deleteBookmark,
  deletePost,
  deleteVote,
  updatePost,
  upsertBookmark,
  upsertVote,
} from "@/lib/repository";
import { BROWSER_ID_COOKIE, BROWSER_ID_MAX_AGE } from "@/lib/browser-id";
import { getProfileAvatarUrl, getProfileDisplayName } from "@/lib/profile-sync";
import { normalizeRouteTree } from "@/lib/route-tree";
import { hasSupabaseAuthConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BullMode, OutRule, RouteTree } from "@/lib/types/domain";

export type DeletePostActionState = {
  ok: boolean;
  message?: string;
};

function getOrCreateBrowserId() {
  const store = cookies();
  const existing = store.get(BROWSER_ID_COOKIE)?.value;
  if (existing) return existing;
  const created = crypto.randomUUID();
  store.set(BROWSER_ID_COOKIE, created, {
    maxAge: BROWSER_ID_MAX_AGE,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return created;
}

function getDemoUserId() {
  return process.env.DEMO_USER_ID ?? "00000000-0000-0000-0000-000000000001";
}

function buildNewPostRedirect(input: {
  remainingScore: number;
  outRule: OutRule;
  bullMode: BullMode;
}) {
  const params = new URLSearchParams();
  if (Number.isFinite(input.remainingScore)) {
    params.set("remaining_score", String(input.remainingScore));
  }
  params.set("out_rule", input.outRule);
  params.set("bull_mode", input.bullMode);
  return `/new?${params.toString()}`;
}

export async function createPostAction(formData: FormData) {
  const remainingScore = Number(formData.get("remaining_score"));
  const dartsLeft = Number(formData.get("darts_left"));
  const outRule = String(formData.get("out_rule")) as OutRule;
  const bullMode = String(formData.get("bull_mode")) as BullMode;
  const routeTreeJson = String(formData.get("route_tree_json") ?? "");
  const comment = String(formData.get("comment") ?? "");

  let parsed: unknown = null;
  if (routeTreeJson) {
    try {
      parsed = JSON.parse(routeTreeJson);
    } catch {
      parsed = null;
    }
  }
  const routeTree: RouteTree = normalizeRouteTree(parsed);
  const redirectPath = buildNewPostRedirect({ remainingScore, outRule, bullMode });

  if (!hasSupabaseAuthConfig) {
    redirect(redirectPath);
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect(redirectPath);
  }

  await createPost({
    supabaseClient: supabase,
    authorUserId: data.user.id,
    authorName: getProfileDisplayName(data.user),
    authorAvatarUrl: getProfileAvatarUrl(data.user),
    remainingScore,
    dartsLeft,
    outRule,
    bullMode,
    routeTree,
    initialComment: comment || undefined,
  });

  revalidatePath("/scores");
  revalidatePath(`/scores/${remainingScore}`);
  redirect(`/scores/${remainingScore}?out_rule=${outRule}&bull_mode=${bullMode}`);
}

export async function editPostAction(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const originalRemainingScore = Number(formData.get("original_remaining_score"));
  const remainingScore = Number(formData.get("remaining_score"));
  const dartsLeft = Number(formData.get("darts_left"));
  const outRule = String(formData.get("out_rule")) as OutRule;
  const bullMode = String(formData.get("bull_mode")) as BullMode;
  const routeTreeJson = String(formData.get("route_tree_json") ?? "");

  if (!postId) throw new Error("投稿が見つかりません。");
  if (
    !Number.isInteger(originalRemainingScore) ||
    originalRemainingScore < 1 ||
    originalRemainingScore > 701
  ) {
    throw new Error("元のスコアが正しくありません。");
  }
  if (!hasSupabaseAuthConfig) throw new Error("ログインが必要です。");

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("ログインが必要です。");

  let parsed: unknown = null;
  if (routeTreeJson) {
    try {
      parsed = JSON.parse(routeTreeJson);
    } catch {
      parsed = null;
    }
  }
  const routeTree: RouteTree = normalizeRouteTree(parsed);

  try {
    await updatePost({
      supabaseClient: supabase,
      authorUserId: data.user.id,
      postId,
      remainingScore,
      dartsLeft,
      outRule,
      bullMode,
      routeTree,
    });
  } catch {
    throw new Error("この投稿は編集できません。");
  }

  revalidatePath("/scores");
  revalidatePath(`/scores/${originalRemainingScore}`);
  revalidatePath(`/scores/${remainingScore}`);
  redirect(`/scores/${remainingScore}?out_rule=${outRule}&bull_mode=${bullMode}`);
}

export async function deletePostAction(
  _prevState: DeletePostActionState,
  formData: FormData
): Promise<DeletePostActionState> {
  const postId = String(formData.get("post_id") ?? "");
  const remainingScore = Number(formData.get("remaining_score"));

  if (!postId) {
    return { ok: false, message: "投稿が見つかりません。" };
  }

  if (!Number.isInteger(remainingScore) || remainingScore < 2 || remainingScore > 180) {
    return { ok: false, message: "スコアが正しくありません。" };
  }

  if (!hasSupabaseAuthConfig) {
    return { ok: false, message: "ログインが必要です。" };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, message: "ログインが必要です。" };
  }

  try {
    await deletePost({
      supabaseClient: supabase,
      authorUserId: data.user.id,
      postId,
      remainingScore,
    });
    return { ok: true };
  } catch {
    return { ok: false, message: "この投稿は削除できません。" };
  }
}

export async function voteAction(formData: FormData) {
  const postId = String(formData.get("post_id"));
  const voteType = String(formData.get("vote_type")) as "up" | "down";
  const browserId = getOrCreateBrowserId();

  await upsertVote({ postId, voteType, browserId });
}

export async function removeVoteAction(formData: FormData) {
  const postId = String(formData.get("post_id"));
  const browserId = getOrCreateBrowserId();
  await deleteVote({ postId, browserId });
}

export async function toggleHelpfulAction(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const remainingScore = Number(formData.get("remaining_score"));
  const shouldReact = formData.get("reacted") === "true";

  if (!postId) throw new Error("投稿が見つかりません。");
  if (!Number.isInteger(remainingScore) || remainingScore < 1 || remainingScore > 701) {
    throw new Error("スコアが正しくありません。");
  }

  const browserId = getOrCreateBrowserId();
  if (shouldReact) {
    await upsertVote({ postId, voteType: "up", browserId });
  } else {
    await deleteVote({ postId, browserId });
  }

  revalidatePath(`/scores/${remainingScore}`);
  return { reacted: shouldReact };
}

export async function toggleBookmarkAction(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const remainingScore = Number(formData.get("remaining_score"));
  const shouldBookmark = formData.get("bookmarked") === "true";

  if (!postId) throw new Error("投稿が見つかりません。");
  if (!Number.isInteger(remainingScore) || remainingScore < 1 || remainingScore > 701) {
    throw new Error("スコアが正しくありません。");
  }
  if (!hasSupabaseAuthConfig) throw new Error("ログインが必要です。");

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("ログインが必要です。");

  if (shouldBookmark) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      display_name: getProfileDisplayName(data.user),
      avatar_url: getProfileAvatarUrl(data.user),
    });
    if (profileError) throw profileError;

    await upsertBookmark({ supabaseClient: supabase, postId, userId: data.user.id });
  } else {
    await deleteBookmark({ supabaseClient: supabase, postId, userId: data.user.id });
  }

  revalidatePath(`/scores/${remainingScore}`);
  revalidatePath("/me/bookmarks");
  revalidatePath(`/me/bookmarks/${remainingScore}`);
  return { bookmarked: shouldBookmark };
}

export async function commentAction(formData: FormData) {
  const postId = String(formData.get("post_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await createComment({
    postId,
    authorUserId: getDemoUserId(),
    body,
  });
}
