/**
 * VitalSync design tokens — "fresh & soft" palette drawn from the logo's
 * lime-to-teal heart. Light and dark share the same keys.
 * Text/background pairs are checked for WCAG AA (4.5:1) contrast.
 */

const light = {
  // Base
  text: '#13261C',

  // Surfaces
  screenBackground: '#F4F8F5',
  cardBackground: '#FFFFFF',
  cardMuted: '#EEF4F0',
  inputBackground: '#FFFFFF',

  // Text
  secondaryText: '#5F7268',
  tertiaryText: '#4A5E53',
  labelText: '#4A5E53',
  placeholderText: '#7D8F84',

  // Lines
  border: '#E1EBE4',

  // Brand
  primary: '#1A8550',
  onPrimary: '#FFFFFF',
  primaryLight: '#E3F6EA',
  primaryText: '#167A49',
  brandLime: '#8EDB5A',
  brandTeal: '#3EC29A',

  // Status
  danger: '#C0362C',
  dangerText: '#C0362C',
  dangerLight: '#FDECEA',
  shadow: '#13261C',

  // Meal categories (background / text)
  breakfastBg: '#FFF4DB',
  breakfastText: '#8A5A00',
  lunchBg: '#E3F6EA',
  lunchText: '#167A49',
  dinnerBg: '#EEEFFF',
  dinnerText: '#4648A8',
  snackBg: '#FFEEE3',
  snackText: '#A8461A',

  // Tip card
  tipBackground: '#13261C',
  tipText: '#F1F7F3',
  tipLabel: '#A9D9BC',

  selectedBackground: '#E3F6EA',
  progressTrack: '#E1EBE4',
};

const dark: typeof light = {
  text: '#E8F1EC',

  screenBackground: '#0E1612',
  cardBackground: '#17221C',
  cardMuted: '#1F2D25',
  inputBackground: '#17221C',

  secondaryText: '#93A69B',
  tertiaryText: '#B3C4BA',
  labelText: '#B3C4BA',
  placeholderText: '#7A8D82',

  border: '#26352D',

  primary: '#4FD488',
  onPrimary: '#06150D',
  primaryLight: '#1A3A28',
  primaryText: '#7FE0A6',
  brandLime: '#8EDB5A',
  brandTeal: '#3EC29A',

  danger: '#FF7A6E',
  dangerText: '#FF7A6E',
  dangerLight: '#3A1C19',
  shadow: '#000000',

  breakfastBg: '#3A2E12',
  breakfastText: '#F5CB6E',
  lunchBg: '#1A3A28',
  lunchText: '#7FE0A6',
  dinnerBg: '#25264A',
  dinnerText: '#B9BBFF',
  snackBg: '#3E2518',
  snackText: '#FFB48A',

  tipBackground: '#1F3A2B',
  tipText: '#F1F7F3',
  tipLabel: '#9FE3BA',

  selectedBackground: '#1A3A28',
  progressTrack: '#26352D',
};

export const Colors = { light, dark };
export type ThemeColors = typeof light;

// Nunito, loaded in app/_layout.tsx, for headings and big numbers.
// Body text keeps the system font. With a custom family, set the weight
// through the family name and leave fontWeight unset (Android ignores it).
export const Fonts = {
  heading: 'Nunito_900Black',
  headingBold: 'Nunito_800ExtraBold',
};

export const Radius = { sm: 12, md: 16, lg: 22, xl: 26, pill: 999 };

export const THEME_PREF_KEY = "theme_preference";
// Email pre-filled on the login screen; deleting the account clears it.
export const LAST_PROFILE_EMAIL_KEY = "last_profile_email";
