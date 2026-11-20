import type { MealCategory } from '@/contexts/meal-plan-context';

// Local calendar day as YYYY-MM-DD (toISOString would shift it to UTC).
export function toLocalDateKey(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

// Defines the canonical display and iteration order for meal categories across all screens
export const CATEGORY_ORDER: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];
export const CATEGORY_LABELS: Record<MealCategory, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};
