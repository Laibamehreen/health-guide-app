// Theme configuration for the Health Guide App
export const COLORS = {
  light: {
    primary: '#0D9488', // Teal
    primaryDark: '#0F766E', // Darker Teal
    primaryLight: '#CCFBF1', // Mint light background
    background: '#F8FAFC', // Slate 50
    surface: '#FFFFFF', // White
    text: '#0F172A', // Slate 900
    textSecondary: '#475569', // Slate 600
    textMuted: '#94A3B8', // Slate 400
    border: '#E2E8F0', // Slate 200
    error: '#EF4444', // Red 500
    success: '#10B981', // Emerald 500
    warning: '#F59E0B', // Amber 500
    cardBg: '#FFFFFF',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.4)',
  },
  dark: {
    primary: '#14B8A6', // Teal
    primaryDark: '#0D9488',
    primaryLight: '#115E59', // Dark Mint
    background: '#0F172A', // Slate 900
    surface: '#1E293B', // Slate 800
    text: '#F8FAFC', // Slate 50
    textSecondary: '#CBD5E1', // Slate 300
    textMuted: '#64748B', // Slate 500
    border: '#334155', // Slate 700
    error: '#F87171', // Red 400
    success: '#34D399', // Emerald 400
    warning: '#FBBF24', // Amber 400
    cardBg: '#1E293B',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.6)',
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const SIZES = {
  base: 8,
  font: 14,
  radius: 12,
  radiusSmall: 8,
  radiusLarge: 20,
};

export const FONTS = {
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700', lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body1: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  body2: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
};
