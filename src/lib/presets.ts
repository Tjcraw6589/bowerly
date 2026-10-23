import type { BillingCycle } from './types';

export interface ServicePreset {
  name: string;
  emoji: string;
  color: string;
  categoryId: string;
  cycle: BillingCycle;
}

const monthly: BillingCycle = { every: 1, unit: 'month' };
const yearly: BillingCycle = { every: 1, unit: 'year' };

/** Popular services, used only to pre-fill the form. Names are typed by the user as plain text. */
export const SERVICE_PRESETS: readonly ServicePreset[] = [
  { name: 'Netflix', emoji: '🎬', color: '#E50914', categoryId: 'cat_streaming', cycle: monthly },
  { name: 'Disney+', emoji: '🏰', color: '#113CCF', categoryId: 'cat_streaming', cycle: monthly },
  { name: 'Hulu', emoji: '📺', color: '#1CE783', categoryId: 'cat_streaming', cycle: monthly },
  { name: 'Max', emoji: '🎥', color: '#002BE7', categoryId: 'cat_streaming', cycle: monthly },
  { name: 'Paramount+', emoji: '⛰️', color: '#0064FF', categoryId: 'cat_streaming', cycle: monthly },
  { name: 'Peacock', emoji: '🦚', color: '#000000', categoryId: 'cat_streaming', cycle: monthly },
  { name: 'Apple TV+', emoji: '🍎', color: '#1C1C1E', categoryId: 'cat_streaming', cycle: monthly },
  { name: 'Prime Video', emoji: '📦', color: '#00A8E1', categoryId: 'cat_streaming', cycle: monthly },
  { name: 'YouTube Premium', emoji: '▶️', color: '#FF0000', categoryId: 'cat_streaming', cycle: monthly },
  { name: 'Crunchyroll', emoji: '🍥', color: '#F47521', categoryId: 'cat_streaming', cycle: monthly },
  { name: 'Spotify', emoji: '🎧', color: '#1DB954', categoryId: 'cat_music', cycle: monthly },
  { name: 'Apple Music', emoji: '🎵', color: '#FA243C', categoryId: 'cat_music', cycle: monthly },
  { name: 'YouTube Music', emoji: '🎶', color: '#FF0000', categoryId: 'cat_music', cycle: monthly },
  { name: 'Tidal', emoji: '🌊', color: '#000000', categoryId: 'cat_music', cycle: monthly },
  { name: 'Audible', emoji: '🎙️', color: '#F8991C', categoryId: 'cat_news', cycle: monthly },
  { name: 'Kindle Unlimited', emoji: '📚', color: '#FF9900', categoryId: 'cat_news', cycle: monthly },
  { name: 'The New York Times', emoji: '📰', color: '#000000', categoryId: 'cat_news', cycle: monthly },
  { name: 'Medium', emoji: '✍️', color: '#000000', categoryId: 'cat_news', cycle: monthly },
  { name: 'Amazon Prime', emoji: '🛒', color: '#FF9900', categoryId: 'cat_utilities', cycle: yearly },
  { name: 'iCloud+', emoji: '☁️', color: '#3693F3', categoryId: 'cat_cloud', cycle: monthly },
  { name: 'Google One', emoji: '🟢', color: '#4285F4', categoryId: 'cat_cloud', cycle: monthly },
  { name: 'Dropbox', emoji: '📁', color: '#0061FF', categoryId: 'cat_cloud', cycle: monthly },
  { name: 'Microsoft 365', emoji: '🪟', color: '#D83B01', categoryId: 'cat_software', cycle: yearly },
  { name: 'Adobe Creative Cloud', emoji: '🎨', color: '#DA1F26', categoryId: 'cat_software', cycle: monthly },
  { name: 'Notion', emoji: '📝', color: '#000000', categoryId: 'cat_software', cycle: monthly },
  { name: 'ChatGPT Plus', emoji: '🤖', color: '#10A37F', categoryId: 'cat_software', cycle: monthly },
  { name: 'Claude Pro', emoji: '✨', color: '#D97757', categoryId: 'cat_software', cycle: monthly },
  { name: '1Password', emoji: '🔒', color: '#0094F5', categoryId: 'cat_software', cycle: yearly },
  { name: 'NordVPN', emoji: '🛡️', color: '#4687FF', categoryId: 'cat_software', cycle: yearly },
  { name: 'GitHub', emoji: '🐙', color: '#24292F', categoryId: 'cat_software', cycle: monthly },
  { name: 'Xbox Game Pass', emoji: '🎮', color: '#107C10', categoryId: 'cat_gaming', cycle: monthly },
  { name: 'PlayStation Plus', emoji: '🕹️', color: '#003791', categoryId: 'cat_gaming', cycle: yearly },
  { name: 'Nintendo Switch Online', emoji: '🍄', color: '#E60012', categoryId: 'cat_gaming', cycle: yearly },
  { name: 'Twitch', emoji: '💜', color: '#9146FF', categoryId: 'cat_gaming', cycle: monthly },
  { name: 'Gym membership', emoji: '🏋️', color: '#F97316', categoryId: 'cat_fitness', cycle: monthly },
  { name: 'Peloton', emoji: '🚴', color: '#DF1C2F', categoryId: 'cat_fitness', cycle: monthly },
  { name: 'Strava', emoji: '🏃', color: '#FC4C02', categoryId: 'cat_fitness', cycle: yearly },
  { name: 'Headspace', emoji: '🧘', color: '#F47D31', categoryId: 'cat_fitness', cycle: yearly },
  { name: 'Calm', emoji: '🌙', color: '#3C8DBC', categoryId: 'cat_fitness', cycle: yearly },
  { name: 'Duolingo', emoji: '🦉', color: '#58CC02', categoryId: 'cat_software', cycle: yearly },
  { name: 'LinkedIn Premium', emoji: '💼', color: '#0A66C2', categoryId: 'cat_software', cycle: monthly },
  { name: 'Patreon', emoji: '🧡', color: '#FF424D', categoryId: 'cat_other', cycle: monthly },
  { name: 'Car insurance', emoji: '🚗', color: '#CA8A04', categoryId: 'cat_finance', cycle: monthly },
  { name: 'Phone plan', emoji: '📱', color: '#14B8A6', categoryId: 'cat_utilities', cycle: monthly },
  { name: 'Internet', emoji: '🌐', color: '#0EA5E9', categoryId: 'cat_utilities', cycle: monthly },
  { name: 'Electricity', emoji: '💡', color: '#F59E0B', categoryId: 'cat_utilities', cycle: monthly },
  { name: 'Rent', emoji: '🏠', color: '#64748B', categoryId: 'cat_utilities', cycle: monthly },
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
