import { getLevelInfo, LEVEL_THRESHOLDS } from './levels';

describe('getLevelInfo', () => {
  it('starts new children at level 1', () => {
    expect(getLevelInfo(0).level).toBe(1);
    expect(getLevelInfo(50).level).toBe(1);
  });

  it('advances at each threshold', () => {
    LEVEL_THRESHOLDS.forEach((threshold, index) => {
      expect(getLevelInfo(threshold).level).toBe(index + 1);
    });
  });

  it('never decreases level for points just below the next threshold', () => {
    expect(getLevelInfo(299).level).toBe(2);
    expect(getLevelInfo(699).level).toBe(3);
  });

  it('caps at the highest level with full progress', () => {
    const info = getLevelInfo(999999);
    expect(info.level).toBe(LEVEL_THRESHOLDS.length);
    expect(info.nextThreshold).toBeNull();
    expect(info.progress).toBe(1);
  });

  it('computes progress towards the next level', () => {
    // Level 1 spans 0..100, so 50 points in is 50% progress.
    expect(getLevelInfo(50).progress).toBeCloseTo(0.5);
  });
});
