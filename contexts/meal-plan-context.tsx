import mealsData from "@/data/meals.json";
import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
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

// Defines the canonical display and iteration order for meal categories across all screens
const CATEGORY_ORDER: MealCategory[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

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
