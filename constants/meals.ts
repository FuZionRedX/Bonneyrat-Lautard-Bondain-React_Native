import { MealCategory } from '@/contexts/meal-plan-context';

export const CATEGORY_ORDER: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];
export const CATEGORY_LABELS: Record<MealCategory, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export function getMealEmoji(category: MealCategory): string {
  if (category === 'breakfast') return '\u{1F963}';
  if (category === 'lunch') return '\u{1F957}';
  if (category === 'dinner') return '\u{1F37D}\uFE0F';
  return '\u{1F34E}';
}
