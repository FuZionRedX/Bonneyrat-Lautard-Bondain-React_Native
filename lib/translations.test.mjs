import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { translate, TRANSLATIONS } from "./translations.ts";

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? sourceFiles(p) : p.endsWith(".tsx") ? [p] : [];
  });
}

// Keys passed through variables rather than as t("...") literals.
const DYNAMIC_KEYS = [
  "Breakfast", "Lunch", "Dinner", "Snack",
  "Male", "Female", "Other",
  "Lose Weight", "Gain Muscle", "Stay Fit", "Eat Healthier",
  "UNDERWEIGHT", "NORMAL", "OVERWEIGHT", "OBESE",
  "low", "medium", "high",
  "Cookie policy", "Personal data protection policy", "Terms and conditions of use",
];

test("every UI string is translated in every language", () => {
  const used = new Set(DYNAMIC_KEYS);
  for (const file of sourceFiles(fileURLToPath(new URL("../app", import.meta.url)))) {
    // t("...") and t('...'): both quote styles are used in app/.
    for (const [, quote, body] of fs.readFileSync(file, "utf8").matchAll(/\bt\((["'])((?:\\.|(?!\1).)*)\1/g)) {
      // Unescape with JSON's rules: a '...' body is first turned into a "..." one.
      const json = quote === '"' ? body : body.replace(/\\'/g, "'").replace(/(?<!\\)"/g, '\\"');
      used.add(JSON.parse(`"${json}"`));
    }
  }
  assert.ok(used.size > 150, `only found ${used.size} keys`);
  for (const [lang, dict] of Object.entries(TRANSLATIONS)) {
    const missing = [...used].filter((key) => !(key in dict));
    assert.deepEqual(missing, [], `${lang} is missing keys`);
  }
});

test("home news has the same tips and articles in every language", () => {
  const news = JSON.parse(fs.readFileSync(new URL("../data/news.json", import.meta.url), "utf8"));
  assert.deepEqual(Object.keys(news).sort(), ["de", "en", "es", "fr"]);
  for (const [lang, { tips, articles }] of Object.entries(news)) {
    assert.equal(tips.length, news.en.tips.length, `${lang} tips`);
    assert.deepEqual(articles.map((a) => a.id), news.en.articles.map((a) => a.id), `${lang} articles`);
  }
});

test("translate fills placeholders and falls back to English", () => {
  assert.equal(translate("fr", "Step {step} of 3", { step: 2 }), "Étape 2 sur 3");
  assert.equal(translate("en", "{n} remaining", { n: 5 }), "5 remaining");
  assert.equal(translate("de", "Not in the dictionary"), "Not in the dictionary");
});
