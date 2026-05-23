import { api } from "@/lib/api";
import type { UserProfile } from "@/types/owner";

export async function getUserProfile(): Promise<UserProfile | null> {
  const res = await api.get<{ profile: UserProfile | null }>("/me");
  return res.profile ?? null;
}

export async function updateUserProfile(data: {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}): Promise<UserProfile | null> {
  const res = await api.patch<{ profile: UserProfile | null }>("/me", data);
  return res.profile ?? null;
}
