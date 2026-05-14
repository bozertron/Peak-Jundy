/**
 * Peak Rentals Design System
 * "Sophisticated Ski Chalet" - Warmth of a mountain lodge meets precision design
 *
 * Created: January 22, 2026
 * Transformed: January 23, 2026
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const colors = {
  // Primary - Deep Forest Green (Trust & Foundation)
  primary: {
    50: '#f2f7f5',
    100: '#dfeae5',
    200: '#bfd7cc',
    300: '#96bda9',
    400: '#5a917a',
    500: '#2D5A47',  // Main - Deep forest green
    600: '#254a3b',
    700: '#1e3d30',
    800: '#183328',
    900: '#142a22',
    950: '#0d1a15',
  },

  // Accent - Warm Brass (Action & Warmth)
  accent: {
    50: '#fdf8e8',
    100: '#faefcb',
    200: '#f5db8a',
    300: '#efc44a',
    400: '#d9a520',
    500: '#B8860B',  // Main - Warm gold brass
    600: '#9a6f09',
    700: '#7e5a08',
    800: '#684a0a',
    900: '#533d0d',
    950: '#2e2106',
  },

  // Secondary - Burgundy (Sophistication)
  secondary: {
    50: '#faf5f5',
    100: '#f5e6e7',
    200: '#eacbce',
    300: '#d8a5ab',
    400: '#b56b75',
    500: '#722F37',  // Main - Wine red
    600: '#62262d',
    700: '#511f25',
    800: '#451a20',
    900: '#3a161b',
    950: '#240c0f',
  },

  // Tertiary - Deep Navy (Depth)
  tertiary: {
    50: '#f3f6f9',
    100: '#e2eaf2',
    200: '#c4d5e5',
    300: '#9ab8d3',
    400: '#6592b8',
    500: '#1E3A5F',  // Main - Deep blue
    600: '#183050',
    700: '#132842',
    800: '#102238',
    900: '#0d1c2e',
    950: '#08111c',
  },

  // Neutral - Cream/Stone (Warm Backgrounds)
  neutral: {
    50: '#FAF7F2',   // Cream - primary background
    100: '#F5F2ED',
    200: '#E7E5E4',  // Stone - secondary
    300: '#D6D3CE',
    400: '#B8B3AB',
    500: '#9C968C',
    600: '#857E74',
    700: '#6E6860',
    800: '#5C5751',
    900: '#4D4945',
    950: '#292724',
  },

  // Additional Accent Colors
  wood: {
    light: '#D4A574',
    main: '#8B6914',
    dark: '#5D4037',
  },
  copper: '#B87333',
  charcoal: '#2C3E50',
  snow: '#FFFFFF',
  slate: '#64748B',

  // Semantic Colors
  success: {
    light: '#d1fae5',
    main: '#10b981',
    dark: '#065f46',
  },
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#92400e',
  },
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#991b1b',
  },
  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#1e40af',
  },

  // Background Surfaces
  surface: {
    base: '#FAF7F2',      // Cream background
    elevated: '#FFFFFF',   // Snow white cards
    sunken: '#F5F2ED',
    overlay: 'rgba(44, 62, 80, 0.8)',  // Charcoal overlay
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font Families
  fonts: {
    // Display: Elegant serif for display
    display: '"Libre Baskerville", "Georgia", serif',
    // Heading: Consistent elegance
    heading: '"Libre Baskerville", "Georgia", serif',
    // Body: Clean, premium sans-serif
    body: '"Inter", "Segoe UI", sans-serif',
    // Mono: Technical
    mono: '"JetBrains Mono", "Consolas", monospace',
  },

  // Font Sizes (rem)
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
  },

  // Font Weights
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },

  // Line Heights
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',  // Elegant spacing for serif display
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
} as const;

// ============================================================================
// BORDERS & RADII
// ============================================================================

export const borders = {
  radius: {
    none: '0',
    sm: '0.25rem',    // 4px - Subtle
    default: '0.5rem', // 8px - Standard
    md: '0.625rem',   // 10px
    lg: '0.75rem',    // 12px - Cards
    xl: '1rem',       // 16px - Modals
    '2xl': '1.5rem',  // 24px - Hero elements
    full: '9999px',   // Pills/circles
  },
  width: {
    default: '1px',
    2: '2px',
    3: '3px',
    4: '4px',
    8: '8px',
  },
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  // Subtle elevation
  xs: '0 1px 2px 0 rgba(44, 62, 80, 0.05)',
  sm: '0 1px 3px 0 rgba(44, 62, 80, 0.08), 0 1px 2px -1px rgba(44, 62, 80, 0.08)',
  // Standard cards
  default: '0 4px 6px -1px rgba(44, 62, 80, 0.08), 0 2px 4px -2px rgba(44, 62, 80, 0.06)',
  md: '0 4px 6px -1px rgba(44, 62, 80, 0.08), 0 2px 4px -2px rgba(44, 62, 80, 0.06)',
  // Elevated elements
  lg: '0 10px 15px -3px rgba(44, 62, 80, 0.1), 0 4px 6px -4px rgba(44, 62, 80, 0.08)',
  xl: '0 20px 25px -5px rgba(44, 62, 80, 0.1), 0 8px 10px -6px rgba(44, 62, 80, 0.08)',
  '2xl': '0 25px 50px -12px rgba(44, 62, 80, 0.2)',
  // Inset for inputs
  inner: 'inset 0 2px 4px 0 rgba(44, 62, 80, 0.04)',
  // Equipment card signature shadow (charcoal-tinted)
  equipment: '0 8px 24px -4px rgba(44, 62, 80, 0.15), 0 4px 8px -2px rgba(44, 62, 80, 0.08)',
  // Framed object shadow - elegant border effect
  frame: '0 2px 8px rgba(44, 62, 80, 0.08), 0 0 0 1px rgba(231, 229, 228, 0.8)',
  // Hover lift
  lift: '0 12px 24px -8px rgba(44, 62, 80, 0.15), 0 4px 8px -4px rgba(44, 62, 80, 0.1)',
  none: 'none',
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  duration: {
    instant: '0ms',
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // Custom spring-like
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    // Smooth deceleration
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Z-INDEX
// ============================================================================

export const zIndex = {
  hide: -1,
  base: 0,
  raised: 1,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
  toast: 1600,
} as const;

// ============================================================================
// COMPONENT TOKENS
// ============================================================================

export const components = {
  // Button variants
  button: {
    primary: {
      bg: colors.primary[500],          // Forest green
      bgHover: colors.primary[600],
      bgActive: colors.primary[700],
      text: '#ffffff',
      border: 'transparent',
    },
    secondary: {
      bg: colors.secondary[500],        // Burgundy
      bgHover: colors.secondary[600],
      bgActive: colors.secondary[700],
      text: '#ffffff',
      border: 'transparent',
    },
    outline: {
      bg: 'transparent',
      bgHover: colors.primary[50],
      bgActive: colors.primary[100],
      text: colors.primary[500],
      border: colors.primary[500],      // Forest border
    },
    ghost: {
      bg: 'transparent',
      bgHover: colors.neutral[100],
      bgActive: colors.neutral[200],
      text: colors.charcoal,
      border: 'transparent',
    },
    danger: {
      bg: colors.error.main,
      bgHover: colors.error.dark,
      bgActive: '#7f1d1d',
      text: '#ffffff',
      border: 'transparent',
    },
  },

  // Card variants
  card: {
    default: {
      bg: colors.surface.elevated,
      border: colors.neutral[200],
      shadow: shadows.default,
    },
    equipment: {
      bg: colors.surface.elevated,
      border: colors.neutral[200],
      borderLeft: colors.accent[500],   // Brass left border accent
      shadow: shadows.equipment,
    },
    stats: {
      bg: colors.primary[50],
      border: colors.primary[200],
      shadow: shadows.sm,
    },
  },

  // Input styles
  input: {
    bg: colors.surface.elevated,
    bgFocus: colors.snow,
    border: colors.neutral[300],
    borderFocus: colors.primary[500],
    text: colors.charcoal,
    placeholder: colors.slate,
    shadow: shadows.inner,
  },

  // Navigation
  nav: {
    bg: colors.surface.elevated,
    bgScrolled: 'rgba(250, 247, 242, 0.95)',  // Cream with transparency
    border: colors.neutral[200],
    text: colors.charcoal,
    textActive: colors.primary[500],
    accent: colors.accent[500],               // Brass accent
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get CSS variable name for a color
 */
export function cssVar(path: string): string {
  return `var(--${path.replace(/\./g, '-')})`;
}

/**
 * Convert hex to RGB for rgba() usage
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

const designSystem = {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  components,
} as const;

export default designSystem;

export type DesignSystem = typeof designSystem;
export type Colors = typeof colors;
export type Typography = typeof typography;
