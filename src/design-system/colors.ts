/**
 * Color tokens. Keep this the single source of truth for color —
 * components should never hardcode hex values.
 */
export const palette = {
  indigo50: '#EEF2FF',
  indigo100: '#E0E7FF',
  indigo200: '#C7D2FE',
  indigo400: '#818CF8',
  indigo500: '#6366F1',
  indigo600: '#4F46E5',
  indigo700: '#4338CA',
  indigo900: '#312E81',

  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber600: '#D97706',

  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',

  rose400: '#FB7185',
  rose500: '#F43F5E',
  rose600: '#E11D48',

  sky400: '#38BDF8',
  sky500: '#0EA5E9',

  orange400: '#FB923C',
  orange500: '#F97316',

  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate150: '#E9EDF3',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate850: '#172033',
  slate900: '#0F172A',
  slate950: '#0A0F1C',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  border: string;
  borderSubtle: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  primary: string;
  primaryMuted: string;
  primaryText: string;
  onPrimary: string;

  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  danger: string;
  dangerMuted: string;
  info: string;
  infoMuted: string;

  points: string;
  pointsMuted: string;
  streak: string;
  streakMuted: string;

  overlay: string;
  shadow: string;
}

export const lightColors: ThemeColors = {
  background: palette.slate50,
  surface: palette.white,
  surfaceElevated: palette.white,
  surfaceMuted: palette.slate100,
  border: palette.slate200,
  borderSubtle: palette.slate150,

  textPrimary: palette.slate900,
  textSecondary: palette.slate600,
  textTertiary: palette.slate400,
  textInverse: palette.white,

  primary: palette.indigo600,
  primaryMuted: palette.indigo50,
  primaryText: palette.indigo700,
  onPrimary: palette.white,

  success: palette.emerald500,
  successMuted: '#ECFDF5',
  warning: palette.amber500,
  warningMuted: '#FFFBEB',
  danger: palette.rose500,
  dangerMuted: '#FFF1F2',
  info: palette.sky500,
  infoMuted: '#F0F9FF',

  points: palette.amber500,
  pointsMuted: '#FFFBEB',
  streak: palette.orange500,
  streakMuted: '#FFF7ED',

  overlay: 'rgba(15, 23, 42, 0.5)',
  shadow: palette.slate900,
} as const;

export const darkColors: ThemeColors = {
  background: palette.slate950,
  surface: palette.slate900,
  surfaceElevated: palette.slate850,
  surfaceMuted: palette.slate850,
  border: palette.slate800,
  borderSubtle: palette.slate850,

  textPrimary: palette.slate50,
  textSecondary: palette.slate300,
  textTertiary: palette.slate500,
  textInverse: palette.slate900,

  primary: palette.indigo400,
  primaryMuted: 'rgba(99, 102, 241, 0.16)',
  primaryText: palette.indigo200,
  onPrimary: palette.slate950,

  success: palette.emerald400,
  successMuted: 'rgba(16, 185, 129, 0.14)',
  warning: palette.amber400,
  warningMuted: 'rgba(245, 158, 11, 0.14)',
  danger: palette.rose400,
  dangerMuted: 'rgba(244, 63, 94, 0.14)',
  info: palette.sky400,
  infoMuted: 'rgba(14, 165, 233, 0.14)',

  points: palette.amber400,
  pointsMuted: 'rgba(245, 158, 11, 0.14)',
  streak: palette.orange400,
  streakMuted: 'rgba(249, 115, 22, 0.14)',

  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: palette.black,
};

/** Fixed brand gradient used for hero/points cards, same in both themes. */
export const brandGradient = [palette.indigo600, palette.indigo400] as const;
export const streakGradient = [palette.orange500, palette.amber400] as const;
