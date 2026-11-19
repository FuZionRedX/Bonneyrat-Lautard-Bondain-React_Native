import { CATEGORY_ORDER, toLocalDateKey } from "@/constants/meals";
import { useProfile } from "@/contexts/profile-context";
import mealsData from "@/data/meals.json";
import { getMealHistory, MealHistoryEntry, saveMealHistory } from "@/lib/api";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

interface MealIngredient {
  name: string;
  quantity: string;
  calories: number;
}

export interface Meal {
  id: number;
  name: string;
  category: "breakfast" | "lunch" | "dinner" | "snack";
  totalCalories: number;
  calorieBand: string;
  ingredients: MealIngredient[];
}

export type MealCategory = Meal["category"];

const ALL_MEALS = (mealsData as { meals: Meal[] }).meals;

interface MealPlanContextValue {
  selectedByCategory: Partial<Record<MealCategory, number[]>>;
  setSelectedByCategory: React.Dispatch<
    React.SetStateAction<Partial<Record<MealCategory, number[]>>>
  >;
  selectedMeals: Meal[];
  // Day being planned, "YYYY-MM-DD" (local). Defaults to today.
  planDate: string;
  setPlanDate: (date: string) => void;
  // The plan of planDate could not be loaded: changes are not saved until a load succeeds.
  loadFailed: boolean;
  // Saved plans (last 7 days and days ahead) from the last load; null if it failed or none yet.
  history: MealHistoryEntry[] | null;
}

const MealPlanContext = createContext<MealPlanContextValue | undefined>(
  undefined
);

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const [selectedByCategory, setSelectedByCategory] = useState<
    Partial<Record<MealCategory, number[]>>
  >({});
  const [planDate, setPlanDate] = useState(() => toLocalDateKey(new Date()));
  // Bumped to retry a failed load.
  const [reloadCount, setReloadCount] = useState(0);
  // Last load result; entries is null when that load failed.
  const [loaded, setLoaded] = useState<{
    email: string;
    date: string;
    entries: MealHistoryEntry[] | null;
  } | null>(null);
  const { profile } = useProfile();
  // "email|date" whose saved plan has been loaded; saving waits for it so an empty
  // in-memory plan never overwrites the one on the server.
  const loadedFor = useRef<string | null>(null);
  const planKey = `${profile.email}|${planDate}`;

  // On login, day change or retry: load that day's plan from the server.
  useEffect(() => {
    loadedFor.current = null;
    if (!profile.email) return;
    let cancelled = false;
    const email = profile.email;
    getMealHistory(email, profile.password).then((entries) => {
      if (cancelled) return;
      setLoaded({ email, date: planDate, entries });
      if (entries === null) {
        // Offline or server down: show an empty day but keep saving off, so a partial
        // edit can't replace the plan stored on the server.
        setSelectedByCategory({});
        return;
      }
      const saved = entries.find((e) => e.saved_at.slice(0, 10) === planDate);
      loadedFor.current = `${email}|${planDate}`;
      setSelectedByCategory(saved?.meal_ids ?? {});
    });
    return () => {
      cancelled = true;
    };
  }, [profile.email, profile.password, planDate, reloadCount]);

  const loadFailed =
    !!profile.email &&
    loaded?.email === profile.email &&
    loaded.date === planDate &&
    loaded.entries === null;
  // Only the logged-in user's history, never the previous user's.
  const history =
    profile.email && loaded?.email === profile.email ? loaded.entries : null;

  // Back on screen: the app may have slept past midnight, so never keep editing a past
  // day (only today and later can be picked), and retry a load that failed.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      const today = toLocalDateKey(new Date());
      setPlanDate((date) => (date < today ? today : date));
      if (loadFailed) setReloadCount((n) => n + 1);
    });
    return () => subscription.remove();
  }, [loadFailed]);

  // Every change to the plan is saved as that day's row (an empty plan deletes it).
  // The date is the device's local day, not the DB server's NOW().
  // shortcut: one request per change, no debounce or ordering; fine for a few taps, queue the saves if they start to race.
  useEffect(() => {
    if (!profile.email || loadedFor.current !== planKey) return;
    saveMealHistory(
      profile.email,
      profile.password,
      selectedByCategory as Record<string, number[]>,
      planDate,
    );
  }, [selectedByCategory, profile.email, profile.password, planDate, planKey]);

  const selectedMeals = useMemo(() => {
    return CATEGORY_ORDER.flatMap((category) => {
      const ids = selectedByCategory[category] ?? [];
      return ALL_MEALS.filter(
        (meal) => meal.category === category && ids.includes(meal.id)
      );
    });
  }, [selectedByCategory]);

  const value = useMemo(
    () => ({
      selectedByCategory,
      setSelectedByCategory,
      selectedMeals,
      planDate,
      setPlanDate,
      loadFailed,
      history,
    }),
    [selectedByCategory, selectedMeals, planDate, loadFailed, history]
  );

  return (
    <MealPlanContext.Provider value={value}>
      {children}
    </MealPlanContext.Provider>
  );
}

export function useMealPlan() {
  const context = useContext(MealPlanContext);
  if (!context) {
    throw new Error("useMealPlan must be used within a MealPlanProvider");
  }
  return context;
}
