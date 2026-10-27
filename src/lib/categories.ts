import type { Category } from './types';

export const OTHER_CATEGORY_ID = 'cat_other';

/**
 * Built-in categories: bill categories first, then subscription categories.
 * Ids are permanent (stored on every item); names and emoji may be refreshed by migrations.
 */
export const BUILT_IN_CATEGORIES: readonly Category[] = [
  { id: 'cat_housing', name: 'Housing', emoji: '🏠', color: '#64748B', builtIn: true },
  { id: 'cat_utilities', name: 'Utilities', emoji: '💡', color: '#14B8A6', builtIn: true },
  { id: 'cat_phone', name: 'Phone & Internet', emoji: '📱', color: '#06B6D4', builtIn: true },
  { id: 'cat_insurance', name: 'Insurance', emoji: '🛡️', color: '#CA8A04', builtIn: true },
  { id: 'cat_finance', name: 'Loans & Credit', emoji: '💳', color: '#B45309', builtIn: true },
  { id: 'cat_transport', name: 'Transport', emoji: '🚗', color: '#0F766E', builtIn: true },
  { id: 'cat_taxes', name: 'Taxes & Fees', emoji: '🧾', color: '#9333EA', builtIn: true },
  { id: 'cat_streaming', name: 'Streaming', emoji: '🎬', color: '#E53958', builtIn: true },
  { id: 'cat_music', name: 'Music', emoji: '🎵', color: '#1DB954', builtIn: true },
  { id: 'cat_software', name: 'Software', emoji: '💻', color: '#3D5AFE', builtIn: true },
  { id: 'cat_cloud', name: 'Cloud & Storage', emoji: '☁️', color: '#0EA5E9', builtIn: true },
  { id: 'cat_gaming', name: 'Gaming', emoji: '🎮', color: '#8B5CF6', builtIn: true },
  { id: 'cat_fitness', name: 'Health & Fitness', emoji: '💪', color: '#F97316', builtIn: true },
  { id: 'cat_news', name: 'News & Reading', emoji: '📰', color: '#64748B', builtIn: true },
  { id: OTHER_CATEGORY_ID, name: 'Other', emoji: '📦', color: '#9CA3AF', builtIn: true },
];

/** Categories that usually hold bills rather than subscriptions; used to suggest the type. */
export const BILL_CATEGORY_IDS: readonly string[] = [
  'cat_housing',
  'cat_utilities',
  'cat_phone',
  'cat_insurance',
  'cat_finance',
  'cat_transport',
  'cat_taxes',
];

/**
 * Brings a stored category list up to date: adds built-ins introduced since it was saved and
 * refreshes the names/emoji of built-ins (custom categories are left exactly as they are).
 */
export function mergeBuiltInCategories(stored: readonly Category[]): Category[] {
  const byId = new Map(stored.map((c) => [c.id, c]));
  const builtIns = BUILT_IN_CATEGORIES.map((b) => {
    const existing = byId.get(b.id);
    return existing ? { ...existing, name: b.name, emoji: b.emoji, builtIn: true } : { ...b };
  });
  const custom = stored.filter((c) => !c.builtIn && !BUILT_IN_CATEGORIES.some((b) => b.id === c.id));
  return [...builtIns, ...custom];
}

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
  '🛡️', '🚌', '⛽', '💧', '🔥', '🏦', '🏫', '🧸', '🗑️', '🔑',
];

export function findCategory(categories: readonly Category[], id: string): Category {
  return (
    categories.find((c) => c.id === id) ??
    categories.find((c) => c.id === OTHER_CATEGORY_ID) ??
    BUILT_IN_CATEGORIES[BUILT_IN_CATEGORIES.length - 1]!
  );
}
