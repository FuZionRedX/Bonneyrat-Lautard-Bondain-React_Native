import type { ImageSourcePropType } from 'react-native';

import type { Meal } from '@/contexts/meal-plan-context';

// Flat dish illustrations, picked from words in the meal name.
const IMAGES = {
  oatmeal: require('@/assets/images/food/oatmeal.png'),
  avocado: require('@/assets/images/food/avocado-toast.png'),
  parfait: require('@/assets/images/food/parfait.png'),
  salad: require('@/assets/images/food/chicken-salad.png'),
  bowl: require('@/assets/images/food/quinoa-bowl.png'),
  salmon: require('@/assets/images/food/salmon.png'),
  pasta: require('@/assets/images/food/pasta.png'),
  curry: require('@/assets/images/food/curry.png'),
  apple: require('@/assets/images/food/apple-pb.png'),
  smoothie: require('@/assets/images/food/smoothie-bowl.png'),
  hummus: require('@/assets/images/food/hummus.png'),
} satisfies Record<string, ImageSourcePropType>;

type ImageKey = keyof typeof IMAGES;

// First match wins, so the more specific words come first.
const RULES: [RegExp, ImageKey][] = [
  [/smoothie|shake/i, 'smoothie'],
  [/salmon|cod|prawn|tuna salad|fish/i, 'salmon'],
  [/curry|chilli|chili|tikka|traybake|pie|meatball/i, 'curry'],
  [/pasta|spaghetti|noodle/i, 'pasta'],
  [/salad|wrap|pitta/i, 'salad'],
  [/bowl|quinoa|rice|couscous|arepa|soup|stuffed|stir-fry/i, 'bowl'],
  [/oat|porridge|pancake/i, 'oatmeal'],
  [/yogurt|yoghurt|skyr|parfait|cottage|chia|pudding/i, 'parfait'],
  [/toast|egg|omelette|sandwich|bread/i, 'avocado'],
  [/hummus|carrot|veg sticks|cracker|fries|chips|rice cake/i, 'hummus'],
  [/apple|pear|nut|date|trail|banana|fruit/i, 'apple'],
];

const BY_CATEGORY: Record<Meal['category'], ImageKey> = {
  breakfast: 'oatmeal',
  lunch: 'salad',
  dinner: 'salmon',
  snack: 'apple',
};

export function getMealImage(meal: Pick<Meal, 'name' | 'category'>): ImageSourcePropType {
  const rule = RULES.find(([pattern]) => pattern.test(meal.name));
  return IMAGES[rule ? rule[1] : BY_CATEGORY[meal.category]];
}
