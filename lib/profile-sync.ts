import type { SupabaseClient, User } from "@supabase/supabase-js";

export function getProfileDisplayName(user: Pick<User, "email" | "user_metadata">) {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  if (user.email) return user.email.split("@")[0] || user.email;
  return "user";
}

export function getProfileAvatarUrl(user: Pick<User, "user_metadata">) {
  const avatarUrl = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  if (typeof avatarUrl === "string" && avatarUrl.trim()) return avatarUrl.trim();
  return null;
}

export async function syncProfileFromAuthUser(supabase: SupabaseClient, user: User) {
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: getProfileDisplayName(user),
    avatar_url: getProfileAvatarUrl(user),
  });

  if (error) throw error;
}
