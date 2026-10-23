// Generates store screenshots from the exported web build at exact store pixel sizes.
// Requires: `npm run export:web` first (dist/), Playwright Chromium installed.
// Output: store/screenshots/<device>/NN-<screen>.png
// The web build renders the same React Native code as the native apps via React Native Web;
// chrome such as the status bar is not included, which the stores allow.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4175;
const BASE = `http://127.0.0.1:${PORT}`;

const DEVICES = [
  { name: 'iphone-6.9', width: 440, height: 956, scale: 3, note: 'iPhone 6.9-inch 1320x2868' },
  { name: 'iphone-6.5', width: 428, height: 926, scale: 3, note: 'iPhone 6.5-inch 1284x2778' },
  { name: 'ipad-13', width: 1032, height: 1376, scale: 2, note: 'iPad 13-inch 2064x2752' },
  { name: 'android-phone', width: 360, height: 640, scale: 3, note: 'Android phone 1080x1920' },
  { name: 'android-tablet-10', width: 800, height: 1280, scale: 2, note: 'Android 10-inch tablet 1600x2560' },
];

const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const now = new Date();
const y = now.getFullYear();
const m = now.getMonth() + 1;
const d = now.getDate();
const soon = (offset) => {
  const t = new Date(y, m - 1, d + offset);
  return iso(t.getFullYear(), t.getMonth() + 1, t.getDate());
};
const anchor = (monthsBack, day) => {
  const t = new Date(y, m - 1 - monthsBack, Math.min(day, 28));
  return iso(t.getFullYear(), t.getMonth() + 1, t.getDate());
};

function sub(id, name, price, cycle, firstBillDate, categoryId, color, emoji, extra = {}) {
  return {
    id,
    name,
    price,
    currency: 'USD',
    cycle,
    firstBillDate,
    categoryId,
    color,
    emoji,
    notes: '',
    reminderDaysBefore: 1,
    status: 'active',
    trialEndDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    cancelledAt: null,
    ...extra,
  };
}

const monthly = { every: 1, unit: 'month' };
const yearly = { every: 1, unit: 'year' };

const seededSubscriptions = [
  sub('s1', 'Netflix', 15.49, monthly, anchor(8, Math.min(d + 2, 28)), 'cat_streaming', '#E50914', '🎬'),
  sub('s2', 'Spotify', 10.99, monthly, anchor(5, Math.min(d + 5, 28)), 'cat_music', '#1DB954', '🎧'),
  sub('s3', 'iCloud+', 2.99, monthly, anchor(12, Math.min(d + 9, 28)), 'cat_cloud', '#3693F3', '☁️'),
  sub('s4', 'Xbox Game Pass', 16.99, monthly, anchor(3, Math.min(d + 13, 28)), 'cat_gaming', '#107C10', '🎮'),
  sub('s5', 'Amazon Prime', 139, yearly, anchor(7, 14), 'cat_utilities', '#FF9900', '🛒'),
  sub('s6', 'Gym membership', 39, monthly, anchor(10, 1), 'cat_fitness', '#F97316', '🏋️'),
  sub('s7', 'The New York Times', 4, { every: 1, unit: 'week' }, anchor(2, Math.min(d + 1, 28)), 'cat_news', '#000000', '📰'),
  sub('s8', 'Audible', 14.95, monthly, soon(8), 'cat_news', '#F8991C', '🎙️', { trialEndDate: soon(7), reminderDaysBefore: 3 }),
  sub('s9', '1Password', 35.88, yearly, anchor(4, 20), 'cat_software', '#0094F5', '🔒'),
  sub('s10', 'Headspace', 69.99, yearly, anchor(1, 8), 'cat_fitness', '#F47D31', '🧘', { status: 'paused' }),
];

const builtInCategories = [
  { id: 'cat_streaming', name: 'Streaming', emoji: '🎬', color: '#E53958', builtIn: true },
  { id: 'cat_music', name: 'Music', emoji: '🎵', color: '#1DB954', builtIn: true },
  { id: 'cat_software', name: 'Software', emoji: '💻', color: '#3D5AFE', builtIn: true },
  { id: 'cat_cloud', name: 'Cloud & Storage', emoji: '☁️', color: '#0EA5E9', builtIn: true },
  { id: 'cat_gaming', name: 'Gaming', emoji: '🎮', color: '#8B5CF6', builtIn: true },
  { id: 'cat_fitness', name: 'Health & Fitness', emoji: '💪', color: '#F97316', builtIn: true },
  { id: 'cat_news', name: 'News & Reading', emoji: '📰', color: '#64748B', builtIn: true },
  { id: 'cat_utilities', name: 'Home & Utilities', emoji: '🏠', color: '#14B8A6', builtIn: true },
  { id: 'cat_finance', name: 'Finance & Insurance', emoji: '💳', color: '#CA8A04', builtIn: true },
  { id: 'cat_other', name: 'Other', emoji: '📦', color: '#9CA3AF', builtIn: true },
];

function persistedState(theme, isPro) {
  return JSON.stringify({
    state: {
      subscriptions: seededSubscriptions,
      categories: builtInCategories,
      settings: { currency: 'USD', theme, reminderHour: 9, notificationsEnabled: true, onboardingComplete: true, summaryPeriod: 'month', sortBy: 'nextBill' },
      meta: { installedAt: '2026-01-01T00:00:00.000Z', sessionCount: 12, lastReviewPromptAt: null, reviewPromptCount: 0, isPro },
    },
    version: 1,
  });
}

const SHOTS = [
  { file: '01-subscriptions', path: '/', theme: 'light', pro: true, wait: 'subscriptions-screen' },
  { file: '02-upcoming', path: '/upcoming', theme: 'light', pro: true, wait: 'upcoming-screen' },
  { file: '03-insights', path: '/insights', theme: 'light', pro: true, wait: 'insights-screen' },
  { file: '04-detail', path: '/subscription/s8', theme: 'light', pro: true, wait: 'detail-screen' },
  { file: '05-editor', path: '/editor?id=s1', theme: 'light', pro: true, wait: 'editor-screen' },
  { file: '06-dark-subscriptions', path: '/', theme: 'dark', pro: true, wait: 'subscriptions-screen' },
  { file: '07-pro', path: '/pro?reason=general', theme: 'dark', pro: false, wait: 'pro-screen' },
  { file: '08-onboarding', path: '/', theme: 'light', pro: false, wait: 'onboarding', fresh: true },
];

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server did not start at ${url}`);
}

const server = spawn(process.execPath, [join(root, 'scripts', 'serve-dist.mjs'), String(PORT)], { stdio: 'inherit' });
try {
  await waitForServer(BASE);
  const browser = await chromium.launch();
  for (const device of DEVICES) {
    const dir = join(root, 'store', 'screenshots', device.name);
    mkdirSync(dir, { recursive: true });
    for (const shot of SHOTS) {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: device.scale,
        isMobile: device.width < 700,
        hasTouch: true,
        colorScheme: shot.theme,
      });
      const page = await context.newPage();
      if (!shot.fresh) {
        const state = persistedState(shot.theme, shot.pro);
        await page.addInitScript((value) => {
          window.localStorage.setItem('subtally-store', value);
        }, state);
      }
      await page.goto(`${BASE}${shot.path}`);
      await page.getByTestId(shot.wait).waitFor({ state: 'visible', timeout: 20_000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(dir, `${shot.file}.png`), fullPage: false });
      await context.close();
      console.log(`${device.name}/${shot.file}.png (${device.width * device.scale}x${device.height * device.scale})`);
    }
  }
  await browser.close();
  console.log('Screenshots written to store/screenshots/. Sizes:', DEVICES.map((x) => `${x.name}=${x.note}`).join('; '));
} finally {
  server.kill();
}
