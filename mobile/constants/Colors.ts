/**
 * Color palette for the AllerSafe app
 * Supports both light and dark modes
 */

export const Colors = {
  light: {
    // Primary colors
    primary: '#4A90E2',
    primaryLight: '#6BA4E8',
    primaryDark: '#3A7BC8',
    
    // Secondary colors
    secondary: '#50C878',
    secondaryLight: '#6FD48F',
    secondaryDark: '#40A060',
    
    // Status colors
    success: '#10B981',
    warning: '#FF9500',
    danger: '#FF3B30',
    info: '#4A90E2',
    
    // Background colors
    background: '#F8F9FA',
    backgroundSecondary: '#FFFFFF',
    card: '#FFFFFF',
    modalBackground: 'rgba(0, 0, 0, 0.5)',
    
    // Text colors
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textDisabled: '#D1D5DB',
    textInverse: '#FFFFFF',
    
    // Border colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    
    // Semantic colors
    successBackground: '#ECFDF5',
    successBorder: '#A7F3D0',
    warningBackground: '#FFF7ED',
    warningBorder: '#FED7AA',
    dangerBackground: '#FEF2F2',
    dangerBorder: '#FECACA',
    infoBackground: '#EFF6FF',
    infoBorder: '#BFDBFE',
    
    // Shadows
    shadowColor: '#000000',
    
    // Status bar
    statusBarStyle: 'dark' as const,
  },
  
  dark: {
    // Primary colors
    primary: '#5BA3F5',
    primaryLight: '#7AB8F7',
    primaryDark: '#4A90E2',
    
    // Secondary colors
    secondary: '#60D888',
    secondaryLight: '#7FE09F',
    secondaryDark: '#50C878',
    
    // Status colors
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    info: '#60A5FA',
    
    // Background colors
    background: '#111827',
    backgroundSecondary: '#1F2937',
    card: '#1F2937',
    modalBackground: 'rgba(0, 0, 0, 0.7)',
    
    // Text colors
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    textDisabled: '#6B7280',
    textInverse: '#1A1A1A',
    
    // Border colors
    border: '#374151',
    borderLight: '#4B5563',
    borderDark: '#1F2937',
    
    // Semantic colors
    successBackground: '#064E3B',
    successBorder: '#059669',
    warningBackground: '#78350F',
    warningBorder: '#D97706',
    dangerBackground: '#7F1D1D',
    dangerBorder: '#DC2626',
    infoBackground: '#1E3A8A',
    infoBorder: '#3B82F6',
    
    // Shadows
    shadowColor: '#000000',
    
    // Status bar
    statusBarStyle: 'light' as const,
  },
};

// Gradient colors
export const Gradients = {
  primary: ['#4A90E2', '#3A7BC8'],
  secondary: ['#50C878', '#40A060'],
  success: ['#10B981', '#059669'],
  warning: ['#FF9500', '#F97316'],
  danger: ['#FF3B30', '#DC2626'],
  sunset: ['#FF9500', '#FF3B30'],
  ocean: ['#4A90E2', '#50C878'],
};

// Chart colors (for data visualization)
export const ChartColors = {
  light: [
    '#4A90E2',
    '#50C878',
    '#FF9500',
    '#FF3B30',
    '#8B5CF6',
    '#EC4899',
    '#10B981',
    '#F59E0B',
  ],
  dark: [
    '#60A5FA',
    '#34D399',
    '#FBBF24',
    '#F87171',
    '#A78BFA',
    '#F472B6',
    '#6EE7B7',
    '#FCD34D',
  ],
};

// Opacity values
export const Opacity = {
  transparent: 0,
  minimal: 0.05,
  light: 0.1,
  medium: 0.5,
  strong: 0.8,
  opaque: 1,
};

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof Colors.light;
