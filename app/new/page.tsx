import { signInWithGoogleAction } from "@/app/actions/auth-actions";
import { NewPostForm } from "@/components/new-post-form";
import { hasSupabaseAuthConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BullMode, OutRule } from "@/lib/types/domain";
import Link from "next/link";

interface PageProps {
  searchParams: {
    remaining_score?: string;
    out_rule?: string;
    bull_mode?: string;
    auth_error?: string;
  };
}

const outRules: OutRule[] = ["double_out", "master_out", "single_out"];
const bullModes: BullMode[] = ["separate", "fat"];

function normalizeScore(value?: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 70;
  return Math.max(1, Math.min(701, Math.trunc(parsed)));
}

function normalizeOutRule(value?: string): OutRule {
  return outRules.includes(value as OutRule) ? (value as OutRule) : "double_out";
}

function normalizeBullMode(value?: string): BullMode {
  return bullModes.includes(value as BullMode) ? (value as BullMode) : "separate";
}

function buildNextPath(searchParams: PageProps["searchParams"]) {
  const params = new URLSearchParams();
  if (searchParams.remaining_score) params.set("remaining_score", searchParams.remaining_score);
  if (searchParams.out_rule) params.set("out_rule", searchParams.out_rule);
  if (searchParams.bull_mode) params.set("bull_mode", searchParams.bull_mode);
  const query = params.toString();
  return query ? `/new?${query}` : "/new";
}

function getAuthErrorMessage(value?: string) {
  if (value === "missing_config") return "Supabaseの認証設定が未設定です。";
  if (value === "oauth") return "Googleログインを開始できませんでした。";
  return null;
}

export default async function NewPage({ searchParams }: PageProps) {
  let isSignedIn = false;

  if (hasSupabaseAuthConfig) {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    isSignedIn = Boolean(data.user);
  }

  if (!isSignedIn) {
    const errorMessage = getAuthErrorMessage(searchParams.auth_error);

    return (
      <section className="new-post-page">
        <div className="login-required-panel">
          <div className="login-required-copy">
            <p className="page-eyebrow">ルートを共有</p>
            <h1>ログインして投稿</h1>
            <p>
              あなたのアレンジをぜひ登録してください。
              <br />
              投稿の信頼性を保つため、Googleログインをお願いしています。
            </p>
          </div>
          {errorMessage ? <p className="auth-error-message">{errorMessage}</p> : null}
          <div className="login-required-actions">
            <form action={signInWithGoogleAction}>
              <input type="hidden" name="next" value={buildNextPath(searchParams)} />
              <button type="submit" className="new-form-submit">
                Googleでログイン
              </button>
            </form>
            <Link href="/scores" className="login-secondary-link">
              スコア一覧へ
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="new-post-page">
      <header>
        <p className="page-eyebrow">ルートを共有</p>
        <h1>新しいアレンジ</h1>
      </header>
      <NewPostForm
        initialRemainingScore={normalizeScore(searchParams.remaining_score)}
        initialOutRule={normalizeOutRule(searchParams.out_rule)}
        initialBullMode={normalizeBullMode(searchParams.bull_mode)}
      />
    </section>
  );
}
