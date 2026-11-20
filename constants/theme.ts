/**
 * VitalSync design tokens — "fresh & soft" palette drawn from the logo's
 * lime-to-teal heart. Light and dark share the same keys.
 * Text/background pairs are checked for WCAG AA (4.5:1) contrast.
 */

const light = {
  // Base
  text: '#13261C',
  background: '#F4F8F5',
  tint: '#1A8550',
  icon: '#5F7268',
  tabIconDefault: '#5F7268',
  tabIconSelected: '#167A49',

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
  subtitleText: '#4A5E53',

  // Lines
  border: '#E1EBE4',
  borderLight: '#E1EBE4',

  // Brand
  primary: '#1A8550',
  onPrimary: '#FFFFFF',
  primaryLight: '#E3F6EA',
  primaryDark: '#0F5C36',
  primaryText: '#167A49',
  brandLime: '#8EDB5A',
  brandTeal: '#3EC29A',

  // Status
  danger: '#C0362C',
  dangerText: '#C0362C',
  dangerLight: '#FDECEA',
  info: '#2F6FC4',
  warning: '#C2620A',
  link: '#167A49',
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

  // Legacy keys still used by some screens
  heroBackground: '#E3F6EA',
  loginBarBackground: '#FFFFFF',
  loginInputBackground: '#FFFFFF',
  loginButtonBackground: '#1A8550',
  loginButtonText: '#FFFFFF',
  darkCard: '#13261C',
  darkCardText: '#F1F7F3',
  darkCardSubtext: '#A9D9BC',
  selectedBorder: '#1A8550',
  selectedBackground: '#E3F6EA',
  progressTrack: '#E1EBE4',
  progressFill: '#1A8550',
  chipBackground: '#EEF4F0',
  chipText: '#4A5E53',
};

const dark: typeof light = {
  text: '#E8F1EC',
  background: '#0E1612',
  tint: '#4FD488',
  icon: '#93A69B',
  tabIconDefault: '#93A69B',
  tabIconSelected: '#7FE0A6',

  screenBackground: '#0E1612',
  cardBackground: '#17221C',
  cardMuted: '#1F2D25',
  inputBackground: '#17221C',

  secondaryText: '#93A69B',
  tertiaryText: '#B3C4BA',
  labelText: '#B3C4BA',
  placeholderText: '#7A8D82',
  subtitleText: '#B3C4BA',

  border: '#26352D',
  borderLight: '#26352D',

  primary: '#4FD488',
  onPrimary: '#06150D',
  primaryLight: '#1A3A28',
  primaryDark: '#9FE3BA',
  primaryText: '#7FE0A6',
  brandLime: '#8EDB5A',
  brandTeal: '#3EC29A',

  danger: '#FF7A6E',
  dangerText: '#FF7A6E',
  dangerLight: '#3A1C19',
  info: '#7DB4FF',
  warning: '#FFB45C',
  link: '#7FE0A6',
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

  heroBackground: '#1A3A28',
  loginBarBackground: '#17221C',
  loginInputBackground: '#17221C',
  loginButtonBackground: '#4FD488',
  loginButtonText: '#06150D',
  darkCard: '#1F3A2B',
  darkCardText: '#F1F7F3',
  darkCardSubtext: '#9FE3BA',
  selectedBorder: '#4FD488',
  selectedBackground: '#1A3A28',
  progressTrack: '#26352D',
  progressFill: '#4FD488',
  chipBackground: '#1F2D25',
  chipText: '#B3C4BA',
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
