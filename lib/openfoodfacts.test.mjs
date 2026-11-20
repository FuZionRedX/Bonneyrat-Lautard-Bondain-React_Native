import assert from "node:assert/strict";
import test from "node:test";

import { parseProduct } from "./openfoodfacts.ts";

test("parses a found product", () => {
  const product = parseProduct("3017620422003", {
    status: 1,
    product: {
      product_name: " Nutella ",
      brands: "Ferrero, Nutella",
      nutriments: { "energy-kcal_100g": 539, sugars_100g: "56.3", salt_100g: 0.107 },
      additives_tags: ["en:e322", "en:e322i"],
      allergens_tags: ["en:milk", "en:nuts", "en:soybeans"],
      nutriscore_grade: "E",
      nova_group: 4,
      serving_quantity: "15",
    },
  });
  assert.equal(product.name, "Nutella");
  assert.equal(product.brand, "Ferrero");
  assert.equal(product.kcalPer100g, 539);
  assert.equal(product.per100g.sugars, 56.3);
  assert.equal(product.per100g.fat, null);
  assert.deepEqual(product.additives, ["E322", "E322I"]);
  assert.deepEqual(product.allergens, ["milk", "nuts", "soybeans"]);
  assert.equal(product.nutriScore, "e");
  assert.equal(product.novaGroup, 4);
  assert.equal(product.servingGrams, 15);
});

test("falls back to kJ and ignores unknown grades", () => {
  const product = parseProduct("1", {
    status: 1,
    product: { nutriments: { energy_100g: 418.4 }, nutriscore_grade: "unknown" },
  });
  assert.equal(product.kcalPer100g, 100);
  assert.equal(product.nutriScore, null);
  assert.equal(product.name, "");
  assert.deepEqual(product.additives, []);
});

test("unknown product is null", () => {
  assert.equal(parseProduct("0", { status: 0, status_verbose: "product not found" }), null);
  assert.equal(parseProduct("0", null), null);
});
