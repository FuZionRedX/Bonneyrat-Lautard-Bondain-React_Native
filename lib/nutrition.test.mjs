import assert from "node:assert/strict";
import test from "node:test";

import { getNutrition } from "./nutrition.ts";

const base = { age: "30", gender: "Male", height: "180" };

test("normal BMI: maintenance calories, no deficit", () => {
  const n = getNutrition({ ...base, weight: "80" });
  assert.equal(n.needsWeightLoss, false);
  assert.equal(n.dailyTarget, 2403); // (800 + 1125 - 150 + 5) * 1.35
});

test("BMI >= 25: 500 kcal deficit", () => {
  const n = getNutrition({ ...base, weight: "90" });
  assert.equal(n.needsWeightLoss, true);
  assert.equal(n.dailyTarget, 2038); // 1880 * 1.35 - 500
});

test("deficit never goes below 1200 kcal", () => {
  const n = getNutrition({ age: "60", gender: "Female", height: "150", weight: "70" });
  assert.equal(n.dailyTarget, 1200);
});

test("comma decimals are accepted", () => {
  assert.equal(getNutrition({ ...base, weight: "80,0" }).dailyTarget, 2403);
});

test("missing fields give null, not NaN", () => {
  const n = getNutrition({ ...base, age: "", weight: "80" });
  assert.equal(n.dailyTarget, null);
  assert.ok(n.bmi > 24 && n.bmi < 25);
  assert.equal(getNutrition({ ...base, weight: "" }).bmi, null);
});
