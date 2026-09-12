import { Ionicons } from '@expo/vector-icons';
import React from 'react';

/** Maps our storage-friendly icon keys (used in tasks/programs/rewards/achievements) to Ionicons glyphs. */
const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  star: 'star',
  sunrise: 'sunny',
  sunset: 'partly-sunny',
  sun: 'sunny',
  moon: 'moon',
  'moon-star': 'moon',
  alarm: 'alarm',
  bed: 'bed',
  tooth: 'happy',
  coffee: 'cafe',
  backpack: 'school',
  broom: 'brush',
  kitchen: 'restaurant',
  trash: 'trash',
  plant: 'leaf',
  heart: 'heart',
  droplet: 'water',
  shower: 'water',
  comb: 'cut',
  scissors: 'cut',
  pencil: 'pencil',
  notebook: 'book',
  book: 'book',
  quran: 'book',
  dumbbell: 'barbell',
  run: 'walk',
  beach: 'umbrella',
  screen: 'phone-portrait',
  target: 'flag',
  flag: 'flag',
  flame: 'flame',
  trophy: 'trophy',
  medal: 'medal',
  gift: 'gift',
  sparkles: 'sparkles',
  soap: 'water',
  other: 'ellipsis-horizontal',

  // General-purpose (empty states, section headers, etc.)
  people: 'people-outline',
  activity: 'pulse-outline',
  calendar: 'calendar-outline',
  search: 'search-outline',
  inbox: 'file-tray-outline',
  chart: 'bar-chart-outline',
  checkmark: 'checkmark-circle-outline',
  list: 'list-outline',
  ticket: 'pricetag-outline',
  celebrate: 'sparkles',
};

export function resolveIcon(key: string): keyof typeof Ionicons.glyphMap {
  return ICON_MAP[key] ?? 'star';
}

export function AppIcon({ name, size = 20, color }: { name: string; size?: number; color: string }) {
  return <Ionicons name={resolveIcon(name)} size={size} color={color} />;
}

export const TASK_ICON_OPTIONS = Object.keys(ICON_MAP);
