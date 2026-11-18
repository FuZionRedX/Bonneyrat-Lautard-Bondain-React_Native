import assert from "node:assert/strict";
import test from "node:test";

import { findBestGlobalCombo } from "./suggest.ts";

let nextId = 1;
const meal = (category, totalCalories) => ({
  id: nextId++,
  name: `${category}-${totalCalories}`,
  category,
  totalCalories,
  calorieBand: "",
  ingredients: [],
});

const meals = {
  breakfast: [meal("breakfast", 300), meal("breakfast", 350), meal("breakfast", 500)],
  lunch: [meal("lunch", 450), meal("lunch", 500), meal("lunch", 700)],
  dinner: [meal("dinner", 400), meal("dinner", 450), meal("dinner", 650)],
  snack: [meal("snack", 100), meal("snack", 150), meal("snack", 250)],
};
const targets = { breakfast: 375, lunch: 525, dinner: 450, snack: 150 };
const noHistory = { breakfast: [], lunch: [], dinner: [], snack: [] };
const total = (combo) =>
  Object.values(combo).flat().reduce((s, m) => s + m.totalCalories, 0);

test("never goes over the daily limit, and fills it as much as it can", () => {
  const combo = findBestGlobalCombo(meals, targets, 1500, noHistory);
  assert.ok(total(combo) <= 1500);
  assert.equal(total(combo), 1500);
  for (const [cat, list] of Object.entries(combo)) {
    assert.ok(list.length > 0, `${cat} is empty`);
    assert.ok(list.every((m) => m.category === cat));
  }
});

test("prefers a combo not eaten recently", () => {
  const first = findBestGlobalCombo(meals, targets, 1500, noHistory);
  const recent = Object.fromEntries(
    Object.entries(first).map(([cat, list]) => [cat, [list.map((m) => m.id).sort((a, b) => a - b)]]),
  );
  const second = findBestGlobalCombo(meals, targets, 1500, recent);
  assert.notDeepEqual(second, first);
  assert.ok(total(second) <= 1500);
});
