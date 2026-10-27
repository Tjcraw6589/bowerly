import type { BillingCycle, ItemKind } from './types';

export interface ServicePreset {
  name: string;
  emoji: string;
  color: string;
  categoryId: string;
  cycle: BillingCycle;
  kind: ItemKind;
  /** Bills only: usually paid automatically. */
  autopay?: boolean;
  /** Bills only: the amount usually changes each time. */
  amountVaries?: boolean;
}

const monthly: BillingCycle = { every: 1, unit: 'month' };
const yearly: BillingCycle = { every: 1, unit: 'year' };
const quarterly: BillingCycle = { every: 3, unit: 'month' };

/** Common bills and popular services, used only to pre-fill the form. Names are typed by the user as plain text. */
export const SERVICE_PRESETS: readonly ServicePreset[] = [
  // Bills
  { name: 'Rent', emoji: '🏠', color: '#64748B', categoryId: 'cat_housing', cycle: monthly, kind: 'bill', autopay: false },
  { name: 'Mortgage', emoji: '🏡', color: '#475569', categoryId: 'cat_housing', cycle: monthly, kind: 'bill', autopay: true },
  { name: 'HOA fees', emoji: '🏘️', color: '#64748B', categoryId: 'cat_housing', cycle: monthly, kind: 'bill', autopay: false },
  { name: 'Electricity', emoji: '💡', color: '#F59E0B', categoryId: 'cat_utilities', cycle: monthly, kind: 'bill', autopay: false, amountVaries: true },
  { name: 'Gas (heating)', emoji: '🔥', color: '#EA580C', categoryId: 'cat_utilities', cycle: monthly, kind: 'bill', autopay: false, amountVaries: true },
  { name: 'Water', emoji: '💧', color: '#0284C7', categoryId: 'cat_utilities', cycle: monthly, kind: 'bill', autopay: false, amountVaries: true },
  { name: 'Trash & recycling', emoji: '🗑️', color: '#16A34A', categoryId: 'cat_utilities', cycle: quarterly, kind: 'bill', autopay: false },
  { name: 'Internet', emoji: '🌐', color: '#0EA5E9', categoryId: 'cat_phone', cycle: monthly, kind: 'bill', autopay: true },
  { name: 'Phone plan', emoji: '📱', color: '#06B6D4', categoryId: 'cat_phone', cycle: monthly, kind: 'bill', autopay: true },
  { name: 'Car insurance', emoji: '🚗', color: '#CA8A04', categoryId: 'cat_insurance', cycle: monthly, kind: 'bill', autopay: true },
  { name: 'Home insurance', emoji: '🏠', color: '#CA8A04', categoryId: 'cat_insurance', cycle: yearly, kind: 'bill', autopay: false },
  { name: 'Renters insurance', emoji: '🔑', color: '#CA8A04', categoryId: 'cat_insurance', cycle: monthly, kind: 'bill', autopay: true },
  { name: 'Health insurance', emoji: '🏥', color: '#DC2626', categoryId: 'cat_insurance', cycle: monthly, kind: 'bill', autopay: true },
  { name: 'Life insurance', emoji: '🛡️', color: '#CA8A04', categoryId: 'cat_insurance', cycle: monthly, kind: 'bill', autopay: true },
  { name: 'Credit card', emoji: '💳', color: '#B45309', categoryId: 'cat_finance', cycle: monthly, kind: 'bill', autopay: false, amountVaries: true },
  { name: 'Car loan', emoji: '🚙', color: '#B45309', categoryId: 'cat_finance', cycle: monthly, kind: 'bill', autopay: true },
  { name: 'Student loan', emoji: '🎓', color: '#B45309', categoryId: 'cat_finance', cycle: monthly, kind: 'bill', autopay: true },
  { name: 'Personal loan', emoji: '🏦', color: '#B45309', categoryId: 'cat_finance', cycle: monthly, kind: 'bill', autopay: true },
  { name: 'Transit pass', emoji: '🚌', color: '#0F766E', categoryId: 'cat_transport', cycle: monthly, kind: 'bill', autopay: false },
  { name: 'Parking', emoji: '🅿️', color: '#0F766E', categoryId: 'cat_transport', cycle: monthly, kind: 'bill', autopay: false },
  { name: 'Car registration', emoji: '📋', color: '#0F766E', categoryId: 'cat_transport', cycle: yearly, kind: 'bill', autopay: false },
  { name: 'Property tax', emoji: '🧾', color: '#9333EA', categoryId: 'cat_taxes', cycle: yearly, kind: 'bill', autopay: false },
  { name: 'Childcare', emoji: '🧸', color: '#EC4899', categoryId: 'cat_other', cycle: monthly, kind: 'bill', autopay: false },
  { name: 'Tuition', emoji: '🏫', color: '#9333EA', categoryId: 'cat_other', cycle: monthly, kind: 'bill', autopay: false },
  // Subscriptions
  { name: 'Netflix', emoji: '🎬', color: '#E50914', categoryId: 'cat_streaming', cycle: monthly, kind: 'subscription' },
  { name: 'Disney+', emoji: '🏰', color: '#113CCF', categoryId: 'cat_streaming', cycle: monthly, kind: 'subscription' },
  { name: 'Hulu', emoji: '📺', color: '#1CE783', categoryId: 'cat_streaming', cycle: monthly, kind: 'subscription' },
  { name: 'Max', emoji: '🎥', color: '#002BE7', categoryId: 'cat_streaming', cycle: monthly, kind: 'subscription' },
  { name: 'Paramount+', emoji: '⛰️', color: '#0064FF', categoryId: 'cat_streaming', cycle: monthly, kind: 'subscription' },
  { name: 'Peacock', emoji: '🦚', color: '#000000', categoryId: 'cat_streaming', cycle: monthly, kind: 'subscription' },
  { name: 'Apple TV+', emoji: '🍎', color: '#1C1C1E', categoryId: 'cat_streaming', cycle: monthly, kind: 'subscription' },
  { name: 'Prime Video', emoji: '📦', color: '#00A8E1', categoryId: 'cat_streaming', cycle: monthly, kind: 'subscription' },
  { name: 'YouTube Premium', emoji: '▶️', color: '#FF0000', categoryId: 'cat_streaming', cycle: monthly, kind: 'subscription' },
  { name: 'Crunchyroll', emoji: '🍥', color: '#F47521', categoryId: 'cat_streaming', cycle: monthly, kind: 'subscription' },
  { name: 'Spotify', emoji: '🎧', color: '#1DB954', categoryId: 'cat_music', cycle: monthly, kind: 'subscription' },
  { name: 'Apple Music', emoji: '🎵', color: '#FA243C', categoryId: 'cat_music', cycle: monthly, kind: 'subscription' },
  { name: 'YouTube Music', emoji: '🎶', color: '#FF0000', categoryId: 'cat_music', cycle: monthly, kind: 'subscription' },
  { name: 'Tidal', emoji: '🌊', color: '#000000', categoryId: 'cat_music', cycle: monthly, kind: 'subscription' },
  { name: 'Audible', emoji: '🎙️', color: '#F8991C', categoryId: 'cat_news', cycle: monthly, kind: 'subscription' },
  { name: 'Kindle Unlimited', emoji: '📚', color: '#FF9900', categoryId: 'cat_news', cycle: monthly, kind: 'subscription' },
  { name: 'The New York Times', emoji: '📰', color: '#000000', categoryId: 'cat_news', cycle: monthly, kind: 'subscription' },
  { name: 'Medium', emoji: '✍️', color: '#000000', categoryId: 'cat_news', cycle: monthly, kind: 'subscription' },
  { name: 'Amazon Prime', emoji: '🛒', color: '#FF9900', categoryId: 'cat_other', cycle: yearly, kind: 'subscription' },
  { name: 'iCloud+', emoji: '☁️', color: '#3693F3', categoryId: 'cat_cloud', cycle: monthly, kind: 'subscription' },
  { name: 'Google One', emoji: '🟢', color: '#4285F4', categoryId: 'cat_cloud', cycle: monthly, kind: 'subscription' },
  { name: 'Dropbox', emoji: '📁', color: '#0061FF', categoryId: 'cat_cloud', cycle: monthly, kind: 'subscription' },
  { name: 'Microsoft 365', emoji: '🪟', color: '#D83B01', categoryId: 'cat_software', cycle: yearly, kind: 'subscription' },
  { name: 'Adobe Creative Cloud', emoji: '🎨', color: '#DA1F26', categoryId: 'cat_software', cycle: monthly, kind: 'subscription' },
  { name: 'Notion', emoji: '📝', color: '#000000', categoryId: 'cat_software', cycle: monthly, kind: 'subscription' },
  { name: 'ChatGPT Plus', emoji: '🤖', color: '#10A37F', categoryId: 'cat_software', cycle: monthly, kind: 'subscription' },
  { name: 'Claude Pro', emoji: '✨', color: '#D97757', categoryId: 'cat_software', cycle: monthly, kind: 'subscription' },
  { name: '1Password', emoji: '🔒', color: '#0094F5', categoryId: 'cat_software', cycle: yearly, kind: 'subscription' },
  { name: 'NordVPN', emoji: '🛡️', color: '#4687FF', categoryId: 'cat_software', cycle: yearly, kind: 'subscription' },
  { name: 'GitHub', emoji: '🐙', color: '#24292F', categoryId: 'cat_software', cycle: monthly, kind: 'subscription' },
  { name: 'Xbox Game Pass', emoji: '🎮', color: '#107C10', categoryId: 'cat_gaming', cycle: monthly, kind: 'subscription' },
  { name: 'PlayStation Plus', emoji: '🕹️', color: '#003791', categoryId: 'cat_gaming', cycle: yearly, kind: 'subscription' },
  { name: 'Nintendo Switch Online', emoji: '🍄', color: '#E60012', categoryId: 'cat_gaming', cycle: yearly, kind: 'subscription' },
  { name: 'Twitch', emoji: '💜', color: '#9146FF', categoryId: 'cat_gaming', cycle: monthly, kind: 'subscription' },
  { name: 'Gym membership', emoji: '🏋️', color: '#F97316', categoryId: 'cat_fitness', cycle: monthly, kind: 'subscription' },
  { name: 'Peloton', emoji: '🚴', color: '#DF1C2F', categoryId: 'cat_fitness', cycle: monthly, kind: 'subscription' },
  { name: 'Strava', emoji: '🏃', color: '#FC4C02', categoryId: 'cat_fitness', cycle: yearly, kind: 'subscription' },
  { name: 'Headspace', emoji: '🧘', color: '#F47D31', categoryId: 'cat_fitness', cycle: yearly, kind: 'subscription' },
  { name: 'Calm', emoji: '🌙', color: '#3C8DBC', categoryId: 'cat_fitness', cycle: yearly, kind: 'subscription' },
  { name: 'Duolingo', emoji: '🦉', color: '#58CC02', categoryId: 'cat_software', cycle: yearly, kind: 'subscription' },
  { name: 'LinkedIn Premium', emoji: '💼', color: '#0A66C2', categoryId: 'cat_software', cycle: monthly, kind: 'subscription' },
  { name: 'Patreon', emoji: '🧡', color: '#FF424D', categoryId: 'cat_other', cycle: monthly, kind: 'subscription' },
];

/** Case-insensitive prefix match on each word, limited for display. */
export function searchPresets(query: string, limit = 6): ServicePreset[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  const starts: ServicePreset[] = [];
  const contains: ServicePreset[] = [];
  for (const p of SERVICE_PRESETS) {
    const name = p.name.toLowerCase();
    if (name.startsWith(q)) starts.push(p);
    else if (name.split(/\s+/).some((w) => w.startsWith(q)) || name.includes(q)) contains.push(p);
  }
  return [...starts, ...contains].slice(0, limit);
}

export const AVATAR_EMOJIS: readonly string[] = [
  '🎬', '📺', '🎵', '🎧', '🎮', '🕹️', '💻', '🖥️', '📱', '☁️',
  '📚', '📰', '✍️', '🤖', '✨', '🔒', '🛡️', '🐙', '🎨', '📝',
  '💪', '🏋️', '🚴', '🏃', '🧘', '🌙', '🦉', '💼', '🧡', '⭐',
  '🛒', '📦', '🏠', '💡', '🌐', '🚗', '✈️', '🍔', '☕', '🐾',
  '👶', '🎓', '🏥', '💳', '🧾', '🎁', '🎟️', '🏦', '📷', '🧰',
];
