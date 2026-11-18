// Meal-combo search used by the Recipes screen.
// Only type imports on purpose: `npm test` runs this file directly with Node.
import type { Meal, MealCategory } from "@/contexts/meal-plan-context";

type ByCategory<T> = Record<MealCategory, T>;
type Candidate = { combo: Meal[]; calories: number; usedRecently: boolean };

// Returns all combinations of `size` elements from `arr`
function getCombinations<T>(arr: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (arr.length < size) return [];
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, size - 1).map((c) => [first, ...c]);
  const withoutFirst = getCombinations(rest, size);
  return [...withFirst, ...withoutFirst];
}

// Returns top candidate combos for a single category, keeping at most ~10 options.
function findCategoryCandidates(
  meals: Meal[],
  target: number,
  recentlySeen: number[][],
  maxSize = 3,
): Candidate[] {
  const raw: Candidate[] = [];

  for (let size = 1; size <= Math.min(maxSize, meals.length); size++) {
    for (const combo of getCombinations(meals, size)) {
      const calories = combo.reduce((s, m) => s + m.totalCalories, 0);
      const ids = combo.map((m) => m.id).sort((a, b) => a - b);
      const usedRecently = recentlySeen.some(
        (used) => used.length === ids.length && used.every((id, i) => id === ids[i]),
      );
      raw.push({ combo, calories, usedRecently });
    }
  }

  // Best under-target (highest calories first) + a few over-target fallbacks
  const under = raw
    .filter((c) => c.calories <= target)
    .sort((a, b) => {
      if (a.usedRecently !== b.usedRecently) return a.usedRecently ? 1 : -1;
      return b.calories - a.calories;
    })
    .slice(0, 8);
  const over = raw
    .filter((c) => c.calories > target)
    .sort((a, b) => a.calories - b.calories)
    .slice(0, 2);

  return [...under, ...over];
}

// Finds the best combination across all 4 categories that maximises total calories
// without exceeding the daily limit, preferring unused combos.
// Category order comes from the keys of `allMealsByCategory`.
export function findBestGlobalCombo(
  allMealsByCategory: ByCategory<Meal[]>,
  categoryTargets: ByCategory<number>,
  dailyLimit: number,
  recentHistory: ByCategory<number[][]>,
): ByCategory<Meal[]> {
  const cats = Object.keys(allMealsByCategory) as MealCategory[];
  const perCategory = cats.map((cat) =>
    findCategoryCandidates(allMealsByCategory[cat], categoryTargets[cat], recentHistory[cat]),
  );
  const toResult = (picks: (Candidate | undefined)[]) =>
    Object.fromEntries(cats.map((cat, i) => [cat, picks[i]?.combo ?? []])) as ByCategory<Meal[]>;

  let best: { picks: Candidate[]; total: number; recentCount: number } | null = null;

  for (const a of perCategory[0]) {
    for (const b of perCategory[1]) {
      const ab = a.calories + b.calories;
      if (ab > dailyLimit) continue;
      for (const c of perCategory[2]) {
        const abc = ab + c.calories;
        if (abc > dailyLimit) continue;
        for (const d of perCategory[3]) {
          const total = abc + d.calories;
          if (total > dailyLimit) continue;
          const recentCount = [a, b, c, d].filter((x) => x.usedRecently).length;
          if (
            !best ||
            recentCount < best.recentCount ||
            (recentCount === best.recentCount && total > best.total)
          ) {
            best = { picks: [a, b, c, d], total, recentCount };
          }
        }
      }
    }
  }

  // Fallback: pick per-category best independently
  return toResult(best ? best.picks : perCategory.map((candidates) => candidates[0]));
}
