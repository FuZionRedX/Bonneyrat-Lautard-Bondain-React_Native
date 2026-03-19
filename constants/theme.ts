/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Semantic tokens
    screenBackground: '#F5F7FA',
    cardBackground: '#fff',
    secondaryText: '#9E9E9E',
    tertiaryText: '#555',
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    primary: '#4CAF50',
    primaryLight: '#E8F5E9',
    primaryDark: '#1B5E20',
    primaryText: '#2E7D32',
    danger: '#F44336',
    dangerText: '#C62828',
    info: '#2196F3',
    warning: '#FF9800',
    inputBackground: '#EFF2F4',
    shadow: '#000',
    link: '#0a7ea4',
    // Profile/login specific
    heroBackground: '#A7BEB5',
    loginBarBackground: '#EEF1F1',
    loginInputBackground: '#EFF2F4',
    loginButtonBackground: '#2EEB56',
    loginButtonText: '#0C111D',
    labelText: '#475467',
    placeholderText: '#8597AA',
    subtitleText: '#6B7280',
    darkCard: '#1A1A2E',
    darkCardText: '#fff',
    darkCardSubtext: '#B0BEC5',
    selectedBorder: '#D1FADF',
    selectedBackground: '#ECFDF3',
    progressTrack: '#E0E0E0',
    progressFill: '#4CAF50',
    chipBackground: '#F0F0F0',
    chipText: '#555',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Semantic tokens
    screenBackground: '#151718',
    cardBackground: '#1E2022',
    secondaryText: '#9BA1A6',
    tertiaryText: '#888',
    border: '#333',
    borderLight: '#2A2A2A',
    primary: '#4CAF50',
    primaryLight: '#1B3A1E',
    primaryDark: '#81C784',
    primaryText: '#81C784',
    danger: '#EF5350',
    dangerText: '#EF5350',
    info: '#42A5F5',
    warning: '#FFA726',
    inputBackground: '#2A2D30',
    shadow: '#000',
    link: '#4FC3F7',
    // Profile/login specific
    heroBackground: '#2A3A32',
    loginBarBackground: '#1E2022',
    loginInputBackground: '#2A2D30',
    loginButtonBackground: '#2EEB56',
    loginButtonText: '#0C111D',
    labelText: '#9BA1A6',
    placeholderText: '#666',
    subtitleText: '#9BA1A6',
    darkCard: '#2A2A3E',
    darkCardText: '#ECEDEE',
    darkCardSubtext: '#9BA1A6',
    selectedBorder: '#2E7D32',
    selectedBackground: '#1B3A1E',
    progressTrack: '#333',
    progressFill: '#4CAF50',
    chipBackground: '#2A2D30',
    chipText: '#9BA1A6',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
