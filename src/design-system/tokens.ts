export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  display: 30,
  hero: 36,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const lineHeight = {
  xs: 16,
  sm: 20,
  md: 22,
  lg: 26,
  xl: 28,
  xxl: 32,
  display: 38,
  hero: 44,
} as const;

export const shadowElevation = (level: 1 | 2 | 3, shadowColor: string) => {
  const map = {
    1: { offset: 2, opacity: 0.06, radius: 6, elevation: 2 },
    2: { offset: 4, opacity: 0.08, radius: 12, elevation: 4 },
    3: { offset: 8, opacity: 0.12, radius: 20, elevation: 8 },
  } as const;
  const cfg = map[level];
  return {
    shadowColor,
    shadowOffset: { width: 0, height: cfg.offset },
    shadowOpacity: cfg.opacity,
    shadowRadius: cfg.radius,
    elevation: cfg.elevation,
  };
};
