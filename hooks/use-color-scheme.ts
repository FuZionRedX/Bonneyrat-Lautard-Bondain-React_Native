import { useColorScheme as useRNColorScheme } from 'react-native';

// React Native can return 'unspecified' (or null), which isn't a key of our theme objects
export function useColorScheme(): 'light' | 'dark' {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
