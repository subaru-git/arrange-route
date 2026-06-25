import { signInWithGoogleAction } from "@/app/actions/auth-actions";
import { hasSupabaseAuthConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/user-menu";

function getDisplayName(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  if (user.email) return user.email;
  return "ログイン中";
}

function getAvatarUrl(user: { user_metadata?: Record<string, unknown> }) {
  const avatarUrl = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  if (typeof avatarUrl === "string" && avatarUrl.trim()) return avatarUrl.trim();
  return null;
}

export async function AuthStatus() {
  let user: { email?: string; user_metadata?: Record<string, unknown> } | null = null;

  if (hasSupabaseAuthConfig) {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user) {
    return (
      <form action={signInWithGoogleAction} className="auth-status">
        <input type="hidden" name="next" value="/scores" />
        <button type="submit" className="auth-button">
          Googleでログイン
        </button>
      </form>
    );
  }

  return (
    <div className="auth-status signed-in">
      <UserMenu displayName={getDisplayName(user)} email={user.email} avatarUrl={getAvatarUrl(user)} />
    </div>
  );
}
