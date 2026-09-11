import { LevelInfo } from '@/types/models';

export const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500] as const;

/** Level is derived from lifetime points earned (never decreases), not the spendable balance. */
export function getLevelInfo(lifetimePoints: number): LevelInfo {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (lifetimePoints >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? null;

  const progress =
    nextThreshold === null
      ? 1
      : (lifetimePoints - currentThreshold) / (nextThreshold - currentThreshold);

  return {
    level,
    nameKey: `levels.${level}`,
    currentThreshold,
    nextThreshold,
    progress: Math.max(0, Math.min(1, progress)),
  };
}
