import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors, ThemeColors } from '../constants/Colors';

export function useTheme() {
  const colorScheme = useRNColorScheme() ?? 'light';
  const colors: ThemeColors = Colors[colorScheme];

  return {
    colors,
    colorScheme,
    isDark: colorScheme === 'dark',
  };
}
