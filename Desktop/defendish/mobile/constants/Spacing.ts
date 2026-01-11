/**
 * Spacing system for the AllerSafe app
 * Consistent spacing, border radius, and shadow values
 */

// Spacing scale (based on 4px grid)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
  '7xl': 96,
};

// Border radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Border widths
export const BorderWidth = {
  none: 0,
  thin: 1,
  medium: 2,
  thick: 3,
};

// Shadows (elevation levels)
export const Shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
};

// Icon sizes
export const IconSize = {
  xs: 12,
  sm: 16,
  base: 20,
  md: 24,
  lg: 32,
  xl: 40,
  '2xl': 48,
  '3xl': 64,
};

// Button sizes
export const ButtonHeight = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
};

// Input sizes
export const InputHeight = {
  sm: 36,
  md: 44,
  lg: 52,
};

// Container widths
export const ContainerWidth = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  full: '100%',
};

// Z-index layers
export const ZIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// Animation durations (in milliseconds)
export const Duration = {
  instant: 0,
  fast: 100,
  normal: 200,
  moderate: 300,
  slow: 400,
  slower: 600,
  slowest: 1000,
};

// Animation timing functions
export const Easing = {
  linear: 'linear' as const,
  easeIn: 'ease-in' as const,
  easeOut: 'ease-out' as const,
  easeInOut: 'ease-in-out' as const,
};

// Opacity values
export const OpacityValues = {
  disabled: 0.4,
  pressed: 0.7,
  hover: 0.9,
  full: 1,
};
