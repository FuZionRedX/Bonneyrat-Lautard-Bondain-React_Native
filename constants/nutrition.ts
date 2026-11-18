// Pure calorie / BMI maths shared by Planner, Recipes and Profile.
// No imports on purpose: `npm test` runs this file directly with Node.

type Gender = "male" | "female" | "other";

// Sedentary-to-lightly-active multiplier applied to BMR (Mifflin-St Jeor)
const ACTIVITY_FACTOR = 1.35;
// Daily kcal deficit required to lose ~0.5 kg/week (standard clinical guideline)
const WEIGHT_LOSS_DEFICIT = 500;
const MIN_DAILY_KCAL = 1200;

export function parseProfileNumber(value: string) {
  return Number.parseFloat(value.replace(",", "."));
}

function getGender(genderValue: string): Gender {
  const normalized = genderValue.trim().toLowerCase();
  if (normalized.startsWith("m")) return "male";
  if (normalized.startsWith("f")) return "female";
  return "other";
}

// Written as `!(x > 0)` so empty fields (NaN) also return null.
export function calculateBmi(weightKg: number, heightCm: number) {
  if (!(weightKg > 0 && heightCm > 0)) return null;
  return weightKg / (heightCm / 100) ** 2;
}

function calculateBmr(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: Gender,
) {
  if (!(weightKg > 0 && heightCm > 0 && ageYears > 0)) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (gender === "male") return base + 5;
  if (gender === "female") return base - 161;
  return base - 78;
}

export function getNutrition(profile: {
  height: string;
  weight: string;
  age: string;
  gender: string;
}) {
  const heightCm = parseProfileNumber(profile.height);
  const weightKg = parseProfileNumber(profile.weight);
  const bmi = calculateBmi(weightKg, heightCm);
  const bmr = calculateBmr(
    weightKg,
    heightCm,
    parseProfileNumber(profile.age),
    getGender(profile.gender),
  );
  const needsWeightLoss = bmi !== null && bmi >= 25;

  let dailyTarget: number | null = null;
  if (bmr !== null) {
    const maintenance = bmr * ACTIVITY_FACTOR;
    dailyTarget = needsWeightLoss
      ? Math.max(Math.round(maintenance - WEIGHT_LOSS_DEFICIT), MIN_DAILY_KCAL)
      : Math.round(maintenance);
  }

  return { bmi, bmr, needsWeightLoss, dailyTarget };
}
