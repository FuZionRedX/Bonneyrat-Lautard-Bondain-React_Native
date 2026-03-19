import { ProfileData } from "@/contexts/profile-context";

export const API_BASE = "http://10.0.2.2/health_app";

export interface GetProfileResponse extends Omit<ProfileData, "password"> {
  wasFirstOpen?: boolean;
}

export type LoginProfileResponse =
  | { status: "connected"; profile: GetProfileResponse }
  | { status: "not_found" }
  | { status: "wrong_password" };

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

export async function loginProfile(
  email: string,
  password: string,
): Promise<LoginProfileResponse> {
  // POST to get_profile.php (server verifies password and returns user fields).
  const res = await fetch(`${API_BASE}/get_profile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (data.error === "not_found") {
    return { status: "not_found" };
  }

  if (data.error === "wrong_password") {
    return { status: "wrong_password" };
  }

  return { status: "connected", profile: data as GetProfileResponse };
}
