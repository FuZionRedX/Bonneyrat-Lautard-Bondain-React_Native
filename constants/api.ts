import { ProfileData } from "@/contexts/profile-context";

export const API_BASE = "http://10.0.2.2/health_app";

export async function saveProfile(profile: ProfileData) {
  const res = await fetch(`${API_BASE}/save_profile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  return res.json();
}
