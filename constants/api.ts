import { ProfileData } from "@/contexts/profile-context";
import { Platform } from "react-native";

const NATIVE_DEFAULT_API_BASE = "http://10.0.2.2/health_app";

function resolveWebApiBase() {
  const envWebBase = process.env.EXPO_PUBLIC_WEB_API_BASE_URL;
  if (envWebBase && envWebBase.trim().length > 0) {
    return envWebBase;
  }

  if (typeof window !== "undefined" && window.location?.hostname) {
    // Expo web runs on a different port than Apache/PHP; use same host on default web port.
    return `${window.location.protocol}//${window.location.hostname}/health_app`;
  }

  return "/health_app";
}

export const API_BASE =
  Platform.OS === "web"
    ? resolveWebApiBase()
    : process.env.EXPO_PUBLIC_API_BASE_URL || NATIVE_DEFAULT_API_BASE;

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

export async function deleteAccount(email: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/delete_account.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}
