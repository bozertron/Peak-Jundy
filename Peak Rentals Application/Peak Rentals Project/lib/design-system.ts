/**
 * Peak Rentals Design System
 * "Mountain Workshop" - Rugged outdoor authenticity meets refined craftsmanship
 *
 * Created: January 22, 2026
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const colors = {
  // Primary - Deep Forest Slate (Trust & Foundation)
  primary: {
    50: '#f4f6f5',
    100: '#e3e8e6',
    200: '#c9d3cf',
    300: '#a3b3ac',
    400: '#778d82',
    500: '#5a7268',  // Main
    600: '#475c53',
    700: '#3b4b44',
    800: '#323e39',
    900: '#2b3532',
    950: '#171e1b',
  },

  // Accent - Burnt Orange (Action & Energy)
  accent: {
    50: '#fef6ee',
    100: '#fcebd7',
    200: '#f8d3ae',
    300: '#f3b47b',
    400: '#ed8b45',
    500: '#e86f22',  // Main - Primary CTA
    600: '#d95518',
    700: '#b44016',
    800: '#903419',
    900: '#742d18',
    950: '#3e140a',
  },

  // Secondary - Steel Blue (Equipment & Industrial)
  steel: {
    50: '#f5f7fa',
    100: '#ebeef3',
    200: '#d2dbe6',
    300: '#abbdcf',
    400: '#7e99b4',
    500: '#5e7c9b',
    600: '#4a6481',
    700: '#3d5169',
    800: '#364558',
    900: '#303b4b',
    950: '#202832',
  },

  // Neutral - Warm Gray (Backgrounds & Text)
  neutral: {
    50: '#fafaf9',
    100: '#f5f4f2',
    200: '#e8e6e3',
    300: '#d6d3ce',
    400: '#b8b3ab',
    500: '#9c968c',
    600: '#857e74',
    700: '#6e6860',
    800: '#5c5751',
    900: '#4d4945',
    950: '#292724',
  },

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
    base: '#fafaf9',
    elevated: '#ffffff',
    sunken: '#f0efed',
    overlay: 'rgba(23, 30, 27, 0.8)',
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font Families
  fonts: {
    // Display: Bold, industrial, stencil-inspired
    display: '"Bebas Neue", "Impact", sans-serif',
    // Heading: Strong, geometric, professional
    heading: '"DM Sans", "Helvetica Neue", sans-serif',
    // Body: Clean, readable, friendly
    body: '"Source Sans 3", "Segoe UI", sans-serif',
    // Mono: Technical, equipment specs
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
    widest: '0.15em',  // For display text
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
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  // Standard cards
  default: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  // Elevated elements
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  // Inset for inputs
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  // Equipment card signature shadow (warm tint)
  equipment: '0 8px 24px -4px rgba(232, 111, 34, 0.15), 0 4px 8px -2px rgba(0, 0, 0, 0.08)',
  // Hover lift
  lift: '0 12px 24px -8px rgba(0, 0, 0, 0.15), 0 4px 8px -4px rgba(0, 0, 0, 0.1)',
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
      bg: colors.accent[500],
      bgHover: colors.accent[600],
      bgActive: colors.accent[700],
      text: '#ffffff',
      border: 'transparent',
    },
    secondary: {
      bg: colors.primary[500],
      bgHover: colors.primary[600],
      bgActive: colors.primary[700],
      text: '#ffffff',
      border: 'transparent',
    },
    outline: {
      bg: 'transparent',
      bgHover: colors.primary[50],
      bgActive: colors.primary[100],
      text: colors.primary[700],
      border: colors.primary[300],
    },
    ghost: {
      bg: 'transparent',
      bgHover: colors.neutral[100],
      bgActive: colors.neutral[200],
      text: colors.neutral[700],
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
      border: colors.primary[200],
      borderLeft: colors.accent[500],
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
    bgFocus: '#ffffff',
    border: colors.neutral[300],
    borderFocus: colors.primary[500],
    text: colors.neutral[900],
    placeholder: colors.neutral[400],
    shadow: shadows.inner,
  },

  // Navigation
  nav: {
    bg: colors.surface.elevated,
    bgScrolled: 'rgba(250, 250, 249, 0.95)',
    border: colors.neutral[200],
    text: colors.neutral[700],
    textActive: colors.primary[700],
    accent: colors.accent[500],
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
