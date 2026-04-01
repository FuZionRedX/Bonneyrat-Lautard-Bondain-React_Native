import { loginProfile } from "@/constants/api";
import React, {
    createContext,
    ReactNode,
    useContext,
    useMemo,
    useState,
} from "react";

export interface ProfileData {
  email: string;
  password: string;
  fullName: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  goal: string;
  darkMode: boolean;
}

const defaultProfile: ProfileData = {
  email: "",
  password: "",
  fullName: "",
  age: "",
  gender: "",
  height: "",
  weight: "",
  goal: "",
  darkMode: false,
};

interface ProfileContextValue {
  profile: ProfileData;
  hasProcessedInput: boolean;
  updateProfile: (nextProfile: ProfileData) => void;
  connectProfileByEmail: (
    email: string,
    password: string,
  ) => Promise<
    | { status: "connected"; wasFirstOpen?: boolean }
    | { status: "not_found" }
    | { status: "wrong_password" }
  >;
  logout: () => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [hasProcessedInput, setHasProcessedInput] = useState(false);

  const value = useMemo(
    () => ({
      profile,
      hasProcessedInput,
      updateProfile: (nextProfile: ProfileData) => {
        setProfile(nextProfile);
        setHasProcessedInput(true);
      },
      // Password is stored in profile state so it can be re-submitted on next login
      // (the API requires it for authentication; it is never persisted to disk).
      connectProfileByEmail: async (email: string, password: string) => {
        const result = await loginProfile(email, password);

        if (result.status === "not_found") {
          return { status: "not_found" as const };
        }

        if (result.status === "wrong_password") {
          return { status: "wrong_password" as const };
        }

        const saved = result.profile;

        setProfile({ ...saved, password });
        setHasProcessedInput(true);
        return {
          status: "connected" as const,
          wasFirstOpen: !!saved.wasFirstOpen,
        };
      },
      logout: () => {
        setProfile(defaultProfile);
        setHasProcessedInput(false);
      },
    }),
    [hasProcessedInput, profile],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }

  return context;
}

export function getProfileInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  // "NA" (Not Available) is the placeholder shown in the avatar when no name is set
  if (parts.length === 0) {
    return "NA";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function maskPassword(password: string) {
  if (!password) {
    return "Not set";
  }

  return "•".repeat(password.length);
}
