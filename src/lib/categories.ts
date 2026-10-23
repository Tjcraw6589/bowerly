import type { Category } from './types';

export const OTHER_CATEGORY_ID = 'cat_other';

export const BUILT_IN_CATEGORIES: readonly Category[] = [
  { id: 'cat_streaming', name: 'Streaming', emoji: '🎬', color: '#E53958', builtIn: true },
  { id: 'cat_music', name: 'Music', emoji: '🎵', color: '#1DB954', builtIn: true },
  { id: 'cat_software', name: 'Software', emoji: '💻', color: '#3D5AFE', builtIn: true },
  { id: 'cat_cloud', name: 'Cloud & Storage', emoji: '☁️', color: '#0EA5E9', builtIn: true },
  { id: 'cat_gaming', name: 'Gaming', emoji: '🎮', color: '#8B5CF6', builtIn: true },
  { id: 'cat_fitness', name: 'Health & Fitness', emoji: '💪', color: '#F97316', builtIn: true },
  { id: 'cat_news', name: 'News & Reading', emoji: '📰', color: '#64748B', builtIn: true },
  { id: 'cat_utilities', name: 'Home & Utilities', emoji: '🏠', color: '#14B8A6', builtIn: true },
  { id: 'cat_finance', name: 'Finance & Insurance', emoji: '💳', color: '#CA8A04', builtIn: true },
  { id: OTHER_CATEGORY_ID, name: 'Other', emoji: '📦', color: '#9CA3AF', builtIn: true },
];

export const CATEGORY_COLORS: readonly string[] = [
  '#E53958',
  '#F97316',
  '#CA8A04',
  '#1DB954',
  '#14B8A6',
  '#0EA5E9',
  '#3D5AFE',
  '#8B5CF6',
  '#EC4899',
  '#64748B',
  '#9CA3AF',
  '#0F172A',
];

export const CATEGORY_EMOJIS: readonly string[] = [
  '🎬', '🎵', '💻', '☁️', '🎮', '💪', '📰', '🏠', '💳', '📦',
  '📱', '📚', '🎧', '🧘', '🍔', '🚗', '✈️', '🐾', '👶', '🎓',
  '🛒', '🧰', '📷', '🖥️', '🔒', '💡', '🧾', '🏥', '🎨', '⭐',
];

export function findCategory(categories: readonly Category[], id: string): Category {
  return (
    categories.find((c) => c.id === id) ??
    categories.find((c) => c.id === OTHER_CATEGORY_ID) ??
    BUILT_IN_CATEGORIES[BUILT_IN_CATEGORIES.length - 1]!
  );
}
