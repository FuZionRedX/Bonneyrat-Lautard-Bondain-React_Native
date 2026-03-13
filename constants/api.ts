import { ProfileData } from "@/contexts/profile-context";

export const API_BASE = "http://10.0.2.2/health_app";

export interface GetProfileResponse extends ProfileData {
  wasFirstOpen?: boolean;
}

export async function saveProfile(profile: ProfileData) {
  const res = await fetch(`${API_BASE}/save_profile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  return res.json();
}

export async function getProfile(
  email: string,
): Promise<GetProfileResponse | null> {
  const res = await fetch(
    `${API_BASE}/get_profile.php?email=${encodeURIComponent(email)}`,
  );
  const data = await res.json();
  if (data.error) return null;
  return data as GetProfileResponse;
}
