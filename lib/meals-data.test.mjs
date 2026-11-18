import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const { meals } = JSON.parse(
  readFileSync(new URL("../data/meals.json", import.meta.url), "utf8"),
);

test("every meal's total equals the sum of its ingredients", () => {
  for (const meal of meals) {
    const sum = meal.ingredients.reduce((s, i) => s + i.calories, 0);
    assert.equal(meal.totalCalories, sum, `${meal.id} ${meal.name}`);
  }
});

test("meal ids are unique and categories are known", () => {
  const ids = new Set(meals.map((m) => m.id));
  assert.equal(ids.size, meals.length);
  for (const meal of meals) {
    assert.ok(["breakfast", "lunch", "dinner", "snack"].includes(meal.category), `${meal.id}`);
  }
});
