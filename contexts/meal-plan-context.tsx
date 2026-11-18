import { CATEGORY_ORDER, toLocalDateKey } from "@/constants/meals";
import { useProfile } from "@/contexts/profile-context";
import mealsData from "@/data/meals.json";
import { getMealHistory, saveMealHistory } from "@/lib/api";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
}

const MealPlanContext = createContext<MealPlanContextValue | undefined>(
  undefined
);

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const [selectedByCategory, setSelectedByCategory] = useState<
    Partial<Record<MealCategory, number[]>>
  >({});
  const [planDate, setPlanDate] = useState(() => toLocalDateKey(new Date()));
  const { profile } = useProfile();
  // "email|date" whose saved plan has been loaded; saving waits for it so an empty
  // in-memory plan never overwrites the one on the server.
  const loadedFor = useRef<string | null>(null);
  const planKey = `${profile.email}|${planDate}`;

  // On login or day change: load that day's plan from the server.
  useEffect(() => {
    loadedFor.current = null;
    if (!profile.email) return;
    let cancelled = false;
    getMealHistory(profile.email, profile.password).then((entries) => {
      if (cancelled) return;
      const saved = entries.find((e) => e.saved_at.slice(0, 10) === planDate);
      loadedFor.current = `${profile.email}|${planDate}`;
      setSelectedByCategory(saved?.meal_ids ?? {});
    });
    return () => {
      cancelled = true;
    };
  }, [profile.email, profile.password, planDate]);

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
    }),
    [selectedByCategory, selectedMeals, planDate]
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
