"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createComment,
  createPost,
  deleteVote,
  upsertVote,
} from "@/lib/repository";
import { normalizeRouteTree } from "@/lib/route-tree";
import { BullMode, OutRule, RouteTree } from "@/lib/types/domain";

const BROWSER_ID_KEY = "arrange_browser_id";
const BROWSER_ID_AGE = 60 * 60 * 24 * 365;

function getOrCreateBrowserId() {
  const store = cookies();
  const existing = store.get(BROWSER_ID_KEY)?.value;
  if (existing) return existing;
  const created = crypto.randomUUID();
  store.set(BROWSER_ID_KEY, created, {
    maxAge: BROWSER_ID_AGE,
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

  await createPost({
    authorUserId: getDemoUserId(),
    remainingScore,
    dartsLeft,
    outRule,
    bullMode,
    routeTree,
    initialComment: comment || undefined,
  });

  redirect(`/scores/${remainingScore}?out_rule=${outRule}&bull_mode=${bullMode}`);
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
