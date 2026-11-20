// Product lookup by barcode on Open Food Facts (free, no API key).
// No imports on purpose: `npm test` runs this file directly with Node.

export interface FoodProduct {
  barcode: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  kcalPer100g: number | null;
  // Grams in one serving, when the label gives it.
  servingGrams: number | null;
  per100g: {
    proteins: number | null;
    carbs: number | null;
    sugars: number | null;
    fat: number | null;
    saturatedFat: number | null;
    fiber: number | null;
    salt: number | null;
  };
  // E-numbers, e.g. "E330".
  additives: string[];
  // Allergen names without the language prefix, e.g. "milk".
  allergens: string[];
  // "a" (best) to "e", null when not computed.
  nutriScore: string | null;
  // 1 (unprocessed) to 4 (ultra-processed).
  novaGroup: number | null;
}

const FIELDS = [
  "product_name",
  "brands",
  "image_front_small_url",
  "nutriments",
  "additives_tags",
  "allergens_tags",
  "nutriscore_grade",
  "nova_group",
  "serving_quantity",
].join(",");

function toNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function tagNames(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.replace(/^[a-z]{2}:/, ""));
}

// Turns the API's JSON into a FoodProduct; null when the product is unknown.
export function parseProduct(barcode: string, json: any): FoodProduct | null {
  if (json?.status !== 1 || !json.product) return null;
  const p = json.product;
  const n = p.nutriments ?? {};

  let kcal = toNumber(n["energy-kcal_100g"]);
  // Some labels only give kJ (energy_100g is always kJ).
  const kj = toNumber(n["energy_100g"]);
  if (kcal === null && kj !== null) kcal = kj / 4.184;

  const grade = typeof p.nutriscore_grade === "string" ? p.nutriscore_grade.toLowerCase() : "";
  const nova = toNumber(p.nova_group);
  const serving = toNumber(p.serving_quantity);

  return {
    barcode,
    name: typeof p.product_name === "string" ? p.product_name.trim() : "",
    brand: typeof p.brands === "string" ? p.brands.split(",")[0].trim() : "",
    imageUrl: typeof p.image_front_small_url === "string" ? p.image_front_small_url : null,
    kcalPer100g: kcal === null ? null : Math.round(kcal),
    servingGrams: serving !== null && serving > 0 ? serving : null,
    per100g: {
      proteins: toNumber(n.proteins_100g),
      carbs: toNumber(n.carbohydrates_100g),
      sugars: toNumber(n.sugars_100g),
      fat: toNumber(n.fat_100g),
      saturatedFat: toNumber(n["saturated-fat_100g"]),
      fiber: toNumber(n.fiber_100g),
      salt: toNumber(n.salt_100g),
    },
    additives: tagNames(p.additives_tags).map((code) => code.toUpperCase()),
    allergens: tagNames(p.allergens_tags).map((name) => name.replace(/-/g, " ")),
    nutriScore: /^[a-e]$/.test(grade) ? grade : null,
    novaGroup: nova !== null && nova >= 1 && nova <= 4 ? nova : null,
  };
}

// null = product not in the database. Throws when the server can't be reached.
export async function fetchProduct(barcode: string): Promise<FoodProduct | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`,
    // Open Food Facts asks apps to identify themselves.
    { headers: { "User-Agent": "VitalSync/1.0 (student project)" } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts HTTP ${res.status}`);
  return parseProduct(barcode, await res.json());
}
