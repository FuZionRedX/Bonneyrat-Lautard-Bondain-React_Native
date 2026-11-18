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
}

const MealPlanContext = createContext<MealPlanContextValue | undefined>(
  undefined
);

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const [selectedByCategory, setSelectedByCategory] = useState<
    Partial<Record<MealCategory, number[]>>
  >({});
  const { profile } = useProfile();
  // Email whose saved plan has been loaded; saving waits for it so an empty
  // in-memory plan never overwrites the one on the server.
  const loadedFor = useRef<string | null>(null);

  // On login: restore today's plan from the server.
  useEffect(() => {
    loadedFor.current = null;
    if (!profile.email) return;
    let cancelled = false;
    getMealHistory(profile.email, profile.password).then((entries) => {
      if (cancelled) return;
      const today = toLocalDateKey(new Date());
      const saved = entries.find((e) => e.saved_at.slice(0, 10) === today);
      loadedFor.current = profile.email;
      if (saved) setSelectedByCategory(saved.meal_ids);
    });
    return () => {
      cancelled = true;
    };
  }, [profile.email, profile.password]);

  // Every change to the plan is saved as today's row (an empty plan deletes it).
  // shortcut: one request per change, no debounce or ordering; fine for a few taps, queue the saves if they start to race.
  useEffect(() => {
    if (!profile.email || loadedFor.current !== profile.email) return;
    saveMealHistory(
      profile.email,
      profile.password,
      selectedByCategory as Record<string, number[]>,
      toLocalDateKey(new Date()), // the device's day, not the DB server's NOW()
    );
  }, [selectedByCategory, profile.email, profile.password]);

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
    }),
    [selectedByCategory, selectedMeals]
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
